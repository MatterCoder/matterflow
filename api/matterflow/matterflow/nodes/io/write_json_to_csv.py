from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath
import csv
import os
from typing import List, Dict, Union


def json_to_csv(json_data: Union[List[Dict], Dict], output_file: str, keys: List[str] = None, overwrite: bool = True):
    # Handle case where input is a single JSON object (dict)
    if isinstance(json_data, dict):
        json_array = [json_data]
    elif isinstance(json_data, list):
        json_array = json_data
    else:
        raise ValueError("Input must be a list of JSON objects or a single JSON object")
    
    # Handle empty array case
    if not json_array:
        raise ValueError("The input JSON array is empty")

    # Determine the CSV headers (from provided keys or common keys in JSON objects)
    if keys:
        headers = keys
    else:
        headers = set(json_array[0].keys())
        for obj in json_array[1:]:
            headers.intersection_update(obj.keys())
        headers = sorted(headers)  # Optional: sort headers alphabetically
    
    # Check if headers are empty after intersection
    if not headers:
        raise ValueError("No common keys found across JSON objects")

    # Check if the file already exists and handle overwrite/append logic
    file_exists = os.path.isfile(output_file)
    mode = 'w' if overwrite or not file_exists else 'a'
    
    # Validate headers if appending
    if not overwrite and file_exists:
        with open(output_file, mode='r', newline='') as file:
            existing_headers = file.readline().strip().split(',')
            if sorted(existing_headers) != sorted(headers):
                raise ValueError("Headers in the existing file do not match the JSON object structure")

    try:
        # Write to CSV file
        with open(output_file, mode=mode, newline='') as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            if mode == 'w':  # Write headers if in overwrite mode
                writer.writeheader()
            for obj in json_array:
                # Filter out keys that are not in the headers list
                row = {key: obj.get(key, "") for key in headers}
                writer.writerow(row)
                
        print(f"CSV file '{output_file}' {'overwritten' if overwrite else 'appended'} successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")


class WriteJsonToCsvNode(IONode):
    """WriteJsonToCsvNode

    Writes the current json to a CSV file. Must be a single json object or list of json objects (but must have the same structure)

    Raises:
        NodeException: any error writing Json file, converting
            from json data to csv data.
    """
    name = "Write Json To Csv"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "file": StringParameter(
            "Filename",
            docstring="Csv file to write"
        ),
        "write_mode": SelectParameter(
            "Write Mode",
            options=["overwrite", "append"],
            default="append",
            docstring="Overwrite or append to file"
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
                filter_search_string = flow_vars["exclude"].get_value()

                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None: #if we found what we are looking for then exclude and dont write to disk
                    return '{"excluded":"true"}'

            # Get JSON data
            json_data = predecessor_data[0]

            # Set if appending or overwriting
            overwrite = False
            if flow_vars["write_mode"].get_value() == 'overwrite':
                overwrite = True

            output_file = flow_vars["file"].get_value()
            json_to_csv(json_data=json_data, output_file = output_file, overwrite = overwrite)            

            return '{"written":"true"}'

        except Exception as e:
            raise NodeException('write json to csv', str(e))
