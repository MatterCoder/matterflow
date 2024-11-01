from matterflow.node import ConnectionNode, NodeException
from matterflow.parameters import *
import json
import pandas as pd
from matterflow.connection import *

class MqttConnectionNode(ConnectionNode):
    """MqttConnectionNode

    Reads from the Mqtt Broker into a workflow.

    Raises:
         NodeException: any error reading mqtt, converting
            to workflow.
    """
    name = "MQTT Connection"
    num_in = 0
    num_out = 1

    test_file_path = ""

    OPTIONS = {
        "file": FileParameter(
            "Test Json",
            default=test_file_path,
            docstring="Json File"
        ),
        "connection": TextParameter(
            "Connection Settings",
            default='{"host": "localhost","port": 1883,"keepalive": 60,"username": "mqtt_user","password": "mqtt_password"}',
            docstring="Connection Settings Input"
        ),   
        "input": TextParameter(
            "Input Settings",
            default='{"topics": ["sensor/temperature","home/lights/kids_bedroom"]}',
            docstring="Input Settings Input"
        ),   
    }

    def execute(self, predecessor_data, flow_vars):

        '''
        #executingInBrowser will be true if running in the visual editor and false if running on command line
        executingInBrowser = click.get_text_stream('stdin').isatty() 

        if executingInBrowser:
            return '{"message":"executing in browser"}'        
        else:
            return '{"message":"executing in cli"}'
        '''
        
        try:
            if flow_vars["file"].get_value() == "/tmp/":
                return '{"message":"try uploading a test json file"}'
            else:    
                df = pd.read_json(
                    flow_vars["file"].get_value()
                    , typ='series'
                )

        
                return df.to_json()

        except Exception as e:
            print(str(e))
            raise NodeException('MQTT Connection', str(e))
        
    def validate(self):
        """Validate Node configuration

        Checks all Node options and validates all Parameter classes using
        their validation method.

        Raises:
            ValidationError: invalid Parameter value
        """
        super().validate()

