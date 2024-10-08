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

            # Set up Boto3 resource and specify the bucket and object name
            client = boto3.client('iotsitewise',
                aws_access_key_id = flow_vars["aws_access_key_id"].get_value(),
                aws_secret_access_key = flow_vars["aws_secret_access_key"].get_value(),
                region_name = flow_vars["aws_region_name"].get_value()
            )

            # We are going to have to change this to reflect the incoming model format
            entries = predecessor_data[0]
            try:
                response = client.batch_put_asset_property_value(
                    entries=[entries]
                )

            except Exception as e:
                json_string = '{"error":"aws sitewise error - check your credentials"}'

            return json_string

        except Exception as e:
            raise NodeException('batch put to sitewise', str(e))
