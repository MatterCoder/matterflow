from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import pandas as pd
from io import StringIO  # For handling in-memory text streams
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import jmespath

class WriteJsonToAzureNode(IONode):
    """WriteJsonToAzureNode

    Writes the current JSON to an Azure Blob Storage container.

    Raises:
        NodeException: Any error writing JSON file to Azure Blob Storage.
    """
    name = "Write Json To Azure"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "azure_connection_string": StringParameter(
            "Azure_Connection_String",
            docstring="Azure Storage connection string for Blob Storage"
        ),
        "container_name": StringParameter(
            "Container_Name",
            docstring="Container name in Azure Blob Storage"
        ),
        "filename": StringParameter(
            "Filename",
            docstring="Filename for the blob in the Azure container"
        ),
        "write_mode": SelectParameter(
            "Write Mode",
            options=["overwrite", "append"],
            default="overwrite",
            docstring="Overwrite or append to Azure Blob"
        ),
        "exclude": StringParameter(
            "Exclude",
            default="",
            docstring="Exclude JSON matching this jmespath query"
        ),
    }

    def execute(self, predecessor_data, flow_vars):
        try:
            # Check for exclusion criteria based on the 'exclude' parameter
            if flow_vars["exclude"].get_value() != '':
                filter_search_string = flow_vars["exclude"].get_value()
                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None:  # If exclusion condition is met
                    return '{"excluded":"true"}'

            # Convert JSON data to string and prepare DataFrame
            json_string = json.dumps(predecessor_data[0])
            data = predecessor_data[0]
            df = pd.DataFrame(data)

            # Create an in-memory buffer for JSON data
            json_buffer = StringIO()
            df.to_json(json_buffer, orient='records')

            # Set up Azure Blob Storage client
            connection_string = flow_vars["azure_connection_string"].get_value() or ""
            blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            container_name = flow_vars["container_name"].get_value() or ""
            file_name = flow_vars["filename"].get_value() or ""
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=file_name)

            # Upload the JSON to Azure Blob Storage
            try:
                if flow_vars["write_mode"].get_value() == 'overwrite':
                    blob_client.upload_blob(json_buffer.getvalue(), overwrite=True)
                else:
                    try:
                        # Check if blob exists and read the current content
                        existing_data = blob_client.download_blob().readall().decode('utf-8')
                        # Append the new data to the existing data
                        updated_data = existing_data + '\n' + json_buffer.getvalue()
                    except Exception as e:
                        # If blob doesn't exist, create new with the current data
                        if "BlobNotFound" in str(e):
                            updated_data = json_buffer.getvalue()
                        else:
                            return '{"error":"Azure Blob Storage error - check your credentials, container, and filename"}'

                    # Upload the updated data to the blob
                    blob_client.upload_blob(updated_data, overwrite=True)

            except Exception as e:
                return '{"error":"Azure Blob Storage error - check your credentials, container, and filename"}'

            return json_string

        except Exception as e:
            raise NodeException('write json to azure blob', str(e))
