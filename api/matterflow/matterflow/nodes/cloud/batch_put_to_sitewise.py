from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath
from io import StringIO  # for handling in-memory text streams
import boto3
import pandas as pd

class BatchPutToSitewiseNode(IONode):
    """BatchPutToSitewiseNode

    Sends a list of asset property values to IoT SiteWise. Each value is a timestamp-quality-value (TQV) data point.

    Raises:
        NodeException: any error writing to Sitewise.
    """
    name = "Batch Put To Sitewise"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "aws_access_key_id": StringParameter(
            "AWS_SERVER_PUBLIC_KEY",
            docstring="AWS_SERVER_PUBLIC_KEY for s3"
        ),
        "aws_secret_access_key": StringParameter(
            "AWS_SERVER_SECRET_KEY",
            docstring="AWS_SERVER_SECRET_KEY for s3"
        ),
        "aws_region_name": StringParameter(
            "AWS_REGION_NAME",
            docstring="AWS_REGION_NAME for sitewise"
        ),        
        "exclude": StringParameter(
            "Exclude",
            default="",
            docstring="Exclude json matching this jmespath query"
        ),
        "array_of_entries": BooleanParameter(
            "Input is array of entries",
            default=False,
            docstring="Specify if input is array of entries"
        ),
    }

    def execute(self, predecessor_data, flow_vars):

        #this is an example of what comes in currently
        #we only current handle one entry at a time
        #TBD = we need to handle multiple entries in an array
        #and in that case we dont need to do entries=[entries]
        #in boto3 call
        example_entry_string = '''
    {
      "entryId": "2",
      "propertyAlias": "/sensors/Sensor1/Temperature",
      "propertyValues": [
        {
          "timestamp": {
            "timeInSeconds": 1729627045,
            "offsetInNanos": 0
          },
          "value": {
            "integerValue": 15
          }
        },
        {
          "timestamp": {
            "timeInSeconds": 1729626800,
            "offsetInNanos": 0
          },
          "value": {
            "integerValue": 16
          }
        }
      ]
    }
'''

        try:

            if flow_vars["exclude"].get_value() != '':
                print("trying to exclude now...................")
                filter_search_string = flow_vars["exclude"].get_value()

                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None: #if we found what we are looking for then exclude and dont write to disk
                    return '{"excluded":"true"}'

            # Convert JSON data to string
            json_string = json.dumps(predecessor_data[0])

            print(json_string)

            # Set up Boto3 resource and specify the bucket and object name
            client = boto3.client('iotsitewise',
                aws_access_key_id = flow_vars["aws_access_key_id"].get_value(),
                aws_secret_access_key = flow_vars["aws_secret_access_key"].get_value(),
                region_name = flow_vars["aws_region_name"].get_value()
            )

            entries = predecessor_data[0]
            #entries = json.loads(example_entry_string)

            # If we are passing in a single entry we need to make it a list
            if not flow_vars["array_of_entries"].get_value():
                entries_array = [entries]  
            else:
                entries_array = entries

            try:
                response = client.batch_put_asset_property_value(
                    entries=entries_array
                )

            except Exception as e:
                json_string = '{"error":"aws sitewise error - check your credentials or format"}'
                print(e)

            return json_string

        except Exception as e:
            raise NodeException('batch put to sitewise', str(e))
