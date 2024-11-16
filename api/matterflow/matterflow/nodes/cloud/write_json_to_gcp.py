from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath
from io import StringIO
from google.cloud import storage  # Google Cloud Storage client
from google.oauth2 import service_account
import pandas as pd
import csv
from typing import List, Dict, Union, Optional

class WriteJsonToGCPNode(IONode):
    """WriteJsonToGCPNode

    Writes the current data to a GCP bucket, with an option to convert the data to CSV.

    Raises:
        NodeException: any error writing JSON or CSV file, converting from JSON data.
    """
    name = "Write Json/CSV To GCP"
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
            docstring="Bucketname for GCS"
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
        "output_format": SelectParameter(
            "Output Format",
            options=["json", "csv"],
            default="json",
            docstring="Choose whether to upload as JSON or CSV."
        ),
    }

    class JSONToCSVConverter:
        def __init__(self, columns: Optional[List[str]] = None):
            self.columns = columns

        def flatten_json(self, nested_json: Dict[str, Union[dict, list, str, int, float, bool, None]], parent_key: str = '', sep: str = '/') -> Dict[str, Union[str, int, float, bool, None]]:
            items = []
            for key, value in nested_json.items():
                new_key = f"{parent_key}{sep}{key}" if parent_key else key
                if isinstance(value, dict):
                    items.extend(self.flatten_json(value, new_key, sep=sep).items())
                elif isinstance(value, list):
                    for i, item in enumerate(value):
                        items.extend(self.flatten_json({f"{new_key}[{i}]": item}).items())
                else:
                    items.append((new_key, value))
            return dict(items)

        def json_to_csv(self, json_data: List[Dict], existing_csv: str = '', skip_header: bool = False) -> str:
            if isinstance(json_data, dict):
                json_data = [json_data]

            output = StringIO()
            writer = None

            if existing_csv:
                output.write(existing_csv.rstrip('\n') + '\n')  # Start with existing data

            for entry in json_data:
                flattened_entry = self.flatten_json(entry)
                if self.columns:
                    flattened_entry = {key: flattened_entry.get(key) for key in self.columns}

                if writer is None:
                    fieldnames = self.columns if self.columns else flattened_entry.keys()
                    writer = csv.DictWriter(output, fieldnames=fieldnames)
                    if not existing_csv and not skip_header:
                        writer.writeheader()

                writer.writerow(flattened_entry)

            return output.getvalue()

    def execute(self, predecessor_data, flow_vars):
        try:
            # Check for exclude condition
            if flow_vars["exclude"].get_value() != '':
                filter_search_string = flow_vars["exclude"].get_value()
                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None:  # If match found, skip writing
                    return '{"excluded":"true"}'

            bucket_name = flow_vars["bucket"].get_value()
            file_name = flow_vars["filename"].get_value()
            write_mode = flow_vars["write_mode"].get_value() == 'overwrite'
            output_format = flow_vars["output_format"].get_value()

            credentials_file_path = flow_vars["file"].get_value() or ""

            # Initialize the Google Cloud Storage client
            client = storage.Client.from_service_account_json(
                credentials_file_path
            )
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(file_name)

            if output_format == "csv":
                try:
                    existing_data = blob.download_as_text()
                    skip_header = True  # Skip writing header for new data
                except storage.exceptions.NotFound:
                    existing_data = ""
                    skip_header = False

                converter = self.JSONToCSVConverter()
                csv_data = converter.json_to_csv(predecessor_data[0], existing_csv=existing_data, skip_header=skip_header)

                # Write combined data back to GCS
                blob.upload_from_string(csv_data, content_type='text/csv')
            else:
                # Handle JSON case
                json_string = json.dumps(predecessor_data[0])
                if write_mode:
                    blob.upload_from_string(json_string, content_type='application/json')
                else:
                    try:
                        existing_data = blob.download_as_text()
                        updated_data = existing_data + '\n' + json_string
                    except storage.exceptions.NotFound:
                        updated_data = json_string
                    blob.upload_from_string(updated_data, content_type='application/json')

            return '{"written":"true"}'

        except Exception as e:
            raise NodeException('write data to GCP', str(e))
