from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *

import pandas as pd
import json
import jmespath
import time

def findMappedItems(searchString, predecessor_data):
    #this function will go thru each of the predecessor_data input sources
    #and try to find the search string using jmespath
    #once found the item is return so the order to the predecessor_data is important
    #if not found then an emtry string is returned
    needle = ""

    if len(searchString) == 0:
        return needle
    
    try:
        for source_data in predecessor_data:
            needle = jmespath.search(searchString, source_data)

            if needle is not None:
                return needle # only the first thing found will be returned

    except Exception as e:
        print('mapping jmespath error', str(e))
        return needle

    return needle

def count_curly_bracket_pairs(s):
    # Initialize counters
    open_brackets = 0
    bracket_pairs = 0

    # Iterate through each character in the string
    for char in s:
        if char == '{':
            # Increment open bracket counter
            open_brackets += 1
        elif char == '}':
            # Check if there's an unmatched opening bracket
            if open_brackets > 0:
                open_brackets -= 1
                bracket_pairs += 1

    return bracket_pairs

def replaceCurlys(item, new_json_object, predecessor_data):
    replacedString = item['fieldValue']
    for i in range(count_curly_bracket_pairs(replacedString)):
        for key, value in list(new_json_object.items()):
            placeholder = f'{{{key}}}'
            if placeholder in item['fieldValue']:
                replacedString = replacedString.replace(placeholder, str(value))

    print(replacedString)
    
    #check if we removed all the curly
    if (count_curly_bracket_pairs(replacedString) >0):
        new_json_object[item['fieldName']] = "Error" 
    else:     
        new_json_object[item['fieldName']] = findMappedItems(replacedString, predecessor_data)

    return new_json_object


class MappingNode(ManipulationNode):
    name = "Mapping"
    num_in = 1
    num_out = 1

    '''
    OPTIONS = {
        "modelmapping": StringParameter(
            "ModelMapping",
            default='[]',
            docstring="Model mapping for this instance"
        )
    }
    '''
    OPTIONS = {
        "modelmapping": InstanceSelectParameter(
            "ModelMapping"
        )
    }

    def execute(self, predecessor_data, flow_vars):

        try:
            model_mapping_settings = flow_vars["modelmapping"].get_value()

            # Parse the JSON array string into a Python list of dictionaries
            json_array = json.loads(model_mapping_settings['json_data'])

            # Initialize an empty dictionary to hold the new JSON object
            new_json_object = {}

            # Iterate over each object in the JSON array
            for item in json_array:


                # If the field is a timestamp use the current timestamp
                if item['fieldDatatype'] == 'Timestamp':
                    new_json_object[item['fieldName']] = time.time()
                else:

                    # Replace placeholders with actual values
                    # For example if a jmespath query has a {NodeId} then we replace that
                    # with the value of that model variable. Note: it must be declared before its used
                    if '{' in item['fieldValue'] and '}' in item['fieldValue']:

                        # Replace placeholders with corresponding values from new_json_object
                        new_json_object = replaceCurlys(item, new_json_object, predecessor_data)

                    else:
                        # Use the fieldName as the key and fieldValue as the value in the new JSON object
                        new_json_object[item['fieldName']] = findMappedItems(item['fieldValue'], predecessor_data) 



            # Convert the new JSON object to a JSON string (if needed)
            new_json_object_str = json.dumps(new_json_object)

            # Return the result
            return new_json_object_str


        except Exception as e:
            raise NodeException('mapping', str(e))