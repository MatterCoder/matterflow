from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import pandas as pd
from io import StringIO  # For handling in-memory text streams
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import jmespath

class WriteJsonToAzureNode(IONode):
    """WriteJsonToAzureNode

    Writes the current data (JSON or CSV) to an Azure Blob Storage container.

    Raises:
        NodeException: Any error writing file to Azure Blob Storage.
    """
    name = "Write Json/CSV To Azure"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "azure_connection_string": StringParameter(
            "Azure_Connection_String",
            default="",
            docstring="Azure Storage connection string for Blob Storage"
        ),
        "container_name": StringParameter(
            "Container_Name",
            default="",
            docstring="Container name in Azure Blob Storage"
        ),
        "filename": StringParameter(
            "Filename",
            default="",
            docstring="Filename for the blob in the Azure container"
        ),
        "file_format": SelectParameter(
            "File Format",
            options=["json", "csv"],
            default="json",
            docstring="File format to write (JSON or CSV)"
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

            # Prepare DataFrame from incoming data
            data = predecessor_data[0]
            df = pd.DataFrame(data)

            # Set up Azure Blob Storage client
            connection_string = flow_vars["azure_connection_string"].get_value() or ""
            blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            container_name = flow_vars["container_name"].get_value() or ""
            file_name = flow_vars["filename"].get_value() or ""
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=file_name)

            # Check the desired file format
            file_format = flow_vars["file_format"].get_value()
            buffer = StringIO()

            if file_format == 'json':
                df.to_json(buffer, orient='records')
            elif file_format == 'csv':
                df.to_csv(buffer, index=False)

            content_to_upload = buffer.getvalue()

            # Upload the data to Azure Blob Storage
            if flow_vars["write_mode"].get_value() == 'overwrite':
                blob_client.upload_blob(content_to_upload, overwrite=True)
            else:  # Append mode
                try:
                    # Check if blob exists and read the current content
                    existing_data = blob_client.download_blob().readall().decode('utf-8')
                    if file_format == 'json':
                        # Concatenate JSON records
                        existing_df = pd.read_json(StringIO(existing_data), orient='records')
                        combined_df = pd.concat([existing_df, df], ignore_index=True)
                        combined_df.to_json(buffer, orient='records')
                    elif file_format == 'csv':
                        # Append CSV data
                        existing_df = pd.read_csv(StringIO(existing_data))
                        combined_df = pd.concat([existing_df, df], ignore_index=True)
                        combined_df.to_csv(buffer, index=False)

                    # Update the content to upload
                    content_to_upload = buffer.getvalue()
                except Exception as e:
                    # If blob doesn't exist, create new with the current data
                    if "BlobNotFound" in str(e):
                        content_to_upload = buffer.getvalue()
                    else:
                        raise NodeException('Azure Blob Storage read error', str(e))

                blob_client.upload_blob(content_to_upload, overwrite=True)

            return '{"status":"success"}'

        except Exception as e:
            raise NodeException('write data to azure blob', str(e))
