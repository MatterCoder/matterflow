from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath
from io import StringIO  # for handling in-memory text streams
from google.cloud import storage  # Google Cloud Storage client
from google.oauth2 import service_account
import pandas as pd


class WriteJsonToGCPNode(IONode):
    name = "Write Json To GCP"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "file": FileParameter(
            "File",
            docstring="Google Cloud credentials file."
        ),
        "bucket": StringParameter(
            "Bucketname",
            default="",
            docstring="Bucketname for s3"
        ),
        "filename": StringParameter(
            "Filename",
            default="",
            docstring="Filename to upload to GCS bucket."
        ),
        "write_mode": SelectParameter(
            "Write Mode",
            options=["overwrite", "append"],
            default="overwrite",
            docstring="Overwrite or append to the GCS file."
        ),
        "exclude": StringParameter(
            "Exclude",
            default="",
            docstring="Exclude JSON matching this jmespath query."
        ),        
    }

    def execute(self, predecessor_data, flow_vars):
        try:
            # Check for exclude condition
            if flow_vars["exclude"].get_value() != '':
                filter_search_string = flow_vars["exclude"].get_value()
                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None:  # If match found, skip writing
                    return '{"excluded":"true"}'

            # Convert JSON data to string
            json_string = json.dumps(predecessor_data[0])

            credentials_file_path = flow_vars["file"].get_value() or ""

            try:
                # Initialize the Google Cloud Storage client
                client = storage.Client.from_service_account_json(
                    credentials_file_path
                )

                bucket_name = flow_vars["bucket"].get_value() or ""
                bucket = client.bucket(bucket_name)

                blob_name = flow_vars["filename"].get_value() or ""
                blob = bucket.blob(blob_name)

                if flow_vars["write_mode"].get_value() == 'overwrite':
                    # Overwrite existing file in GCS
                    blob.upload_from_string(json_string, content_type='application/json')
                else:  # Append mode
                    try:
                        existing_data = blob.download_as_text()
                        updated_data = existing_data + '\n' + json_string
                    except storage.exceptions.NotFound:
                        # If the file doesn't exist, create a new one
                        updated_data = json_string
                    
                    # Upload the updated data back to GCS
                    blob.upload_from_string(updated_data, content_type='application/json')
            except Exception as e:
                json_string = '{"error":"GCS error - check your credentials, bucket, and filename"}'
                raise NodeException('write json to GCS', json_string) from e

            return json_string

        except Exception as e:
            raise NodeException('write json to GCP', str(e))

