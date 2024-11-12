from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *
import json
import jmespath
import csv
import os
import io
import pandas as pd
from typing import List, Dict, Union


def json_to_csv(json_data: Union[List[Dict], Dict]):
    keys: List[str] = None
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


    try:
        file = io.StringIO()
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        for obj in json_array:
            # Filter out keys that are not in the headers list
            row = {key: obj.get(key, "") for key in headers}
            writer.writerow(row)
                
        print(f"Json to CSV converted successfully.")
        return file.getvalue()
    
    except Exception as e:
        print(f"An error occurred: {e}")


class JsonToCsvNode(ManipulationNode):
    """JsonToCsvNode

    Converts the current json to CSV format. Must be a single json object or list of json objects (but must have the same structure)

    Raises:
        NodeException: any error converting Json file, converting
            from json data to csv data.
    """
    name = "Json To Csv"
    num_in = 1
    num_out = 1

    OPTIONS = {
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

            #csv_string = json_to_csv(json_data=json_data)          
             
              
            file = io.StringIO()
            df = pd.read_json(io.StringIO(json.dumps(json_data)), orient='index')
            
            df.to_csv(file, index=False) 

            output_data = file.getvalue()

            csv_data = {
                "csv": output_data
            }
            json_string = json.dumps(csv_data)

            return json_string

        except Exception as e:
            raise NodeException('json to csv', str(e))
