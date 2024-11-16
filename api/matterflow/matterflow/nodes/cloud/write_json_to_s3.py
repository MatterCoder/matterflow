from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath
from io import StringIO  # for handling in-memory text streams
import boto3
import pandas as pd
import csv
import os
from typing import List, Dict, Union, Optional

class WriteJsonToS3Node(IONode):
    """WriteJsonToS3Node

    Writes the current json to an S3 bucket, with an option to convert the data to CSV.

    Raises:
        NodeException: any error writing Json or CSV file, converting from json data.
    """
    name = "Write Json/CSV To S3"
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
        "bucket": StringParameter(
            "Bucketname",
            docstring="Bucketname for s3"
        ),
        "filename": StringParameter(
            "Filename",
            docstring="Filename for s3 bucket"
        ),
        "write_mode": SelectParameter(
            "Write Mode",
            options=["overwrite", "append"],
            default="overwrite",
            docstring="Overwrite or append to S3 file"
        ),
        "exclude": StringParameter(
            "Exclude",
            default="",
            docstring="Exclude json matching this jmespath query"
        ),
        "output_format": SelectParameter(
            "Output Format",
            options=["json", "csv"],
            default="json",
            docstring="Choose whether to upload as JSON or CSV"
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
            bucket = flow_vars["bucket"].get_value()
            file_name = flow_vars["filename"].get_value()
            write_mode = flow_vars["write_mode"].get_value() == 'overwrite'
            output_format = flow_vars["output_format"].get_value()

            session = boto3.Session(
                aws_access_key_id=flow_vars["aws_access_key_id"].get_value(),
                aws_secret_access_key=flow_vars["aws_secret_access_key"].get_value(),
            )
            s3_resource = session.resource('s3')

            if output_format == "csv":
                try:
                    obj = s3_resource.Object(bucket, file_name)
                    existing_data = obj.get()['Body'].read().decode('utf-8')
                    skip_header = True  # Skip writing header for new data
                except Exception as e:
                    if hasattr(e, 'response') and e.response['Error']['Code'] == 'NoSuchKey':
                        existing_data = ""
                        skip_header = False
                    else:
                        raise NodeException('write json to s3', 'AWS S3 error - check your credentials, bucket, and filename')

                converter = self.JSONToCSVConverter()
                csv_data = converter.json_to_csv(predecessor_data[0], existing_csv=existing_data, skip_header=skip_header)

                # Write combined data back to S3
                s3_resource.Object(bucket, file_name).put(Body=csv_data)
            else:
                # Handle JSON case (unchanged)
                json_string = json.dumps(predecessor_data[0])
                if write_mode:
                    s3_resource.Object(bucket, file_name).put(Body=json_string)
                else:
                    try:
                        obj = s3_resource.Object(bucket, file_name)
                        existing_data = obj.get()['Body'].read().decode('utf-8')
                        updated_data = existing_data + '\n' + json_string
                    except Exception as e:
                        if hasattr(e, 'response') and e.response['Error']['Code'] == 'NoSuchKey':
                            updated_data = json_string
                        else:
                            raise NodeException('write json to s3', 'AWS S3 error - check your credentials, bucket, and filename')
                    s3_resource.Object(bucket, file_name).put(Body=updated_data)

            return '{"written":"true"}'

        except Exception as e:
            raise NodeException('write json to s3', str(e))