from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath
from io import StringIO  # for handling in-memory text streams
from google.cloud import storage  # Google Cloud Storage client
import pandas as pd

class WriteJsonToGCPNode(IONode):
    """WriteJsonToGCPNode

    Writes the current JSON data to a Google Cloud Storage bucket.

    Raises:
        NodeException: any error while writing JSON file or handling data.
    """
    name = "Write Json To GCP"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "gcs_credentials_file": FileParameter(
            "GCS Credentials File",
            docstring="Google Cloud credentials JSON file."
        ),
        "bucket": StringParameter(
            "Bucket Name",
            docstring="Bucket name for Google Cloud Storage."
        ),
        "filename": StringParameter(
            "Filename",
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

            # Convert the incoming data to a DataFrame and JSON string
            data = predecessor_data[0]
            df = pd.DataFrame(data)
            json_buffer = StringIO()
            df.to_json(json_buffer, orient='records')

            # Initialize the Google Cloud Storage client
            gcs_credentials_file = flow_vars["gcs_credentials_file"].get_value()

            if gcs_credentials_file:
                client = storage.Client.from_service_account_json(gcs_credentials_file)
            else:
                # Handle the case where no value is returned, e.g. log an error or use default credentials
                print("Error: No GCS credentials file provided")
                # Optionally, handle default behavior, e.g. creating the client without credentials
                client = storage.Client()  # This might create a default client with application default credentials

            bucket_name = flow_vars["bucket"].get_value()
            bucket = client.bucket(bucket_name)
            blob_name = flow_vars["filename"].get_value()
            blob = bucket.blob(blob_name)

            try:
                if flow_vars["write_mode"].get_value() == 'overwrite':
                    # Overwrite existing file in GCS
                    blob.upload_from_string(json_buffer.getvalue(), content_type='application/json')
                else:  # Append mode
                    try:
                        existing_data = blob.download_as_text()
                        updated_data = existing_data + '\n' + json_buffer.getvalue()
                    except storage.exceptions.NotFound:
                        # If the file doesn't exist, create a new one
                        updated_data = json_buffer.getvalue()
                    
                    # Upload the updated data back to GCS
                    blob.upload_from_string(updated_data, content_type='application/json')
            except Exception as e:
                json_string = '{"error":"GCS error - check your credentials, bucket, and filename"}'
                raise NodeException('write json to GCS', json_string) from e

            return json_buffer.getvalue()

        except Exception as e:
            raise NodeException('write json to GCP', str(e))
