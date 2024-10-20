from matterflow.node import IONode, NodeException
from matterflow.parameters import *

import pandas as pd
import csv
import json
import os

class WriteCsvNode(IONode):
    """WriteCsvNode

    Writes the current DataFrame to a CSV file.

    Raises:
        NodeException: any error writing CSV file, converting
            from DataFrame.
    """
    name = "Write CSV"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "file": StringParameter(
            "Filename",
            docstring="CSV file to write"
        ),
        "sep": StringParameter(
            "Delimiter",
            default=",",
            docstring="Column delimiter"
        ),
        "index": BooleanParameter(
            "Write Index",
            default=True,
            docstring="Write index as column?"
        ),
    }

    def write_json_to_csv(self, json_obj, csv_file, separator=',', add_index=False):
        # Check if the CSV file exists
        file_exists = os.path.isfile(csv_file)
        
        # Extract keys from the JSON object
        keys = json_obj.keys()
        
        # Write the JSON data to CSV
        with open(csv_file, 'a', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=['index'] + list(keys), delimiter=separator)
            
            if not file_exists:
                writer.writeheader()
            else:
                with open(csv_file, 'r') as check_file:
                    reader = csv.DictReader(check_file, delimiter=separator)

                    existing_keys = set(reader.fieldnames)
                    existing_keys.remove('index')
                    if set(keys) != existing_keys:
                        raise ValueError("New JSON object keys do not match the columns in the existing CSV file.")
                        
            if add_index:
                with open(csv_file, 'r') as check_file:
                    reader = csv.DictReader(check_file, delimiter=separator)
                    index = sum(1 for _ in reader) + 1
                    
                writer.writerow({'index': index, **json_obj})
            else:
                writer.writerow(json_obj)

    def execute(self, predecessor_data, flow_vars):
        try:

            # Write to CSV and save
            self.write_json_to_csv(
                predecessor_data[0],
                csv_file=flow_vars["file"].get_value(),
                separator=flow_vars["sep"].get_value(),
                add_index=flow_vars["index"].get_value()
            )

            return '{"written":"true"}'
        except Exception as e:
            raise NodeException('write csv', str(e))
