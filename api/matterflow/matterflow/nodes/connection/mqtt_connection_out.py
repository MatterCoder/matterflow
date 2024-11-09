from matterflow.node import ConnectionNode, NodeException
from matterflow.parameters import *
import json
import pandas as pd
from matterflow.connection import *
import jmespath
import asyncio
import aiomqtt

class MqttConnectionOutNode(ConnectionNode):
    """MqttConnectionOutNode

    Send messages to the Mqtt Broker from a workflow.

    Raises:
         NodeException: any error sending mqtt, converting
            to workflow.
    """
    name = "MQTT Connection (Out)"
    num_in = 1
    num_out = 0

    test_file_path = ""

    OPTIONS = {
        "connection": TextParameter(
            "Connection Settings",
            default='{"host": "localhost","port": 1883,"username": "mqtt_user","password": "mqtt_password"}',
            docstring="Connection Settings"
        ),   
        "output": TextParameter(
            "Output",
            default='{"Topic": "sensors/response","QoS": 1,"Named Root": "sensor_data","Retain": false,"Breakup Arrays": false,"Template": "{temperature}","AWS IoT Core": false}',
            docstring="Output Settings"
        ),
        "exclude": StringParameter(
            "Exclude",
            default="",
            docstring="Exclude json matching this jmespath query"
        ),
    }
        
    def execute(self, predecessor_data, flow_vars):

        try:
            if flow_vars["exclude"].get_value() != '':
                print("trying to exclude now...................")
                filter_search_string = flow_vars["exclude"].get_value()

                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None: #if we found what we are looking for then exclude and dont write to disk
                    return '{"excluded":"true"}'

            # Convert JSON data to string
            json_string = json.dumps(predecessor_data[0])

            # Create the MQTT client
            connection_settings = json.loads(flow_vars["connection"].get_value())
            output_settings  = json.loads(flow_vars["output"].get_value())

            # Define the async task to run the MQTT client publish
            async def mqtt_publish(payload, connection_settings, output_settings):
                try:
                    async with aiomqtt.Client(hostname = connection_settings["host"], port = connection_settings["port"]) as client:
                        await client.publish(output_settings["Topic"], payload=payload)
                except Exception as e:
                    print(f"Error in MQTT publish: {str(e)}")
                    raise

            payload = json_string
            # Check if an event loop is already running
            try:
                loop = asyncio.get_running_loop()
                # Run the task in the current running loop
                asyncio.create_task(mqtt_publish(payload, connection_settings, output_settings))
            except RuntimeError:  # No event loop is running
                asyncio.run(mqtt_publish(payload, connection_settings, output_settings))

            return json_string

        except Exception as e:
            print(str(e))
            raise NodeException('MQTT Connection Out', str(e))
        
    def validate(self):
        """Validate Node configuration

        Checks all Node options and validates all Parameter classes using
        their validation method.

        Raises:
            ValidationError: invalid Parameter value
        """
        super().validate()

