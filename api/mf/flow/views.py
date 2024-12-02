import os
import json
import sys
import glob

from matterflow import WorkflowException
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from drf_yasg.utils import swagger_auto_schema
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers

from modulefinder import ModuleFinder

from .models import FlowModel

@swagger_auto_schema(method='post',
                     operation_summary='Create a new flow.',
                     operation_description='Creates a new flow.',
                     responses={
                         200: 'Created new flow'
                     })
@api_view(['POST'])
def new_flow(request):
    """Create a new flow.

    Initialize a new, empty, flow object and store it in the session.

    Return:
        200 - Created new flow
    """
    try:
        json_data = json.loads(request.body)
        # Create new flow
        flow = FlowModel(name=json_data['name'], description=json_data['description'], json_data=json_data['json_data']) # create new model instance
        flow.save() #save to db        
        return JsonResponse({
            'Message': 'Flow Created',
            'Id': flow.id,
            'Request Body': json.dumps(json_data)
        })
    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'No React model ID provided': str(e)}, status=500)

@swagger_auto_schema(method='get',
                     operation_summary='Retrieve list of flows.',
                     operation_description='Retrieves a list of flow.',
                     responses={
                         200: 'List of successor flows.',
                         404: 'No flows exists.',
                         500: 'Error retrieving list of flows.'
                     })
@api_view(['GET'])
def get_flows(request):
    """Get sorted list of Flow.

    Generates a list of all flows.

    Returns:
        List of flows.
    """
    try:
        all_entries = json.loads(serializers.serialize("json", FlowModel.objects.all()))
        flows = []
        for item in all_entries:
            entry = {}
            entry['id'] = item['pk']
            for key,value in item['fields'].items():
                entry[key] = value
            flows.append(entry)

        response = { "data": flows}
        return JsonResponse(response, status=200)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=500)

    return JsonResponse(order, safe=False)


@swagger_auto_schema(method='get',
                     operation_summary='Retrieve a node from the graph',
                     operation_description='Retrieves a node from the graph.',
                     responses={
                         200: 'JSON response with data',
                         400: 'No file specified',
                         404: 'Node/graph not found'
                     })
@swagger_auto_schema(method='post',
                     operation_summary='Update a node from the graph',
                     operation_description='Updates a node from the graph.',
                     responses={
                         200: 'JSON response with data',
                         400: 'No file specified',
                         404: 'Node/graph not found'
                     })
@swagger_auto_schema(method='delete',
                     operation_summary='Delete a node from the graph',
                     operation_description='Deletes a node from the graph.',
                     responses={
                         200: 'JSON response with data',
                         400: 'No file specified',
                         404: 'Node/graph not found',
                         405: 'Method not allowed',
                         500: 'Error processing Node change'
                     })
@api_view(['GET', 'POST', 'DELETE'])
@csrf_exempt
def handle_flow(request, flow_id):
    """ Retrieve, update, or delete a flow

    Returns:
        200 - flow was found; data in JSON format
        404 - flow does not exist
        405 - Method not allowed
        500 - Error processing flow change
    """

    if flow_id is None:
        return JsonResponse({
            'message': 'The request does not contain a flow id'
        }, status=404)

    # Process request
    try:
        if request.method == 'GET':
            item = json.loads(serializers.serialize("json", FlowModel.objects.filter(pk=flow_id)))
            entry = {}
            entry['id'] = flow_id
            for key,value in item[0]['fields'].items():
                entry[key] = value

            response = JsonResponse({
                'data': entry
            }, safe=False)
        elif request.method == 'POST':
            updates = json.loads(request.body)
            FlowModel.objects.filter(pk=flow_id).update(**updates)
            return JsonResponse({
                'message': 'POST successful'
            }, safe=False)
        elif request.method == 'DELETE':
            try:
                #Try to Delete the flow files and processes
                item = json.loads(serializers.serialize("json", FlowModel.objects.filter(pk=flow_id)))
                flow_name = item[0]['fields']['name']

                #1. Delete the workflows file in the /tmp or /data folder 
                DIR_PATH = os.getenv('DIR_PATH') or '/tmp'
                pattern = f"{DIR_PATH}/{flow_name}*" 
                for file_path in glob.glob(pattern):
                    if os.path.isfile(file_path):
                        os.remove(file_path)

                #2. Delete the file to the supervisord in supervisor_confs folder       
                dir_path = os.path.dirname(os.path.realpath(__file__))
                #supervisord_filename = f"{dir_path}/../../supervisor_confs/{flow_name}.conf"
                supervisord_filename = f"{DIR_PATH}/{flow_name}.conf"
                os.remove(supervisord_filename)
            except:
                pass

            #Delete the flow entry from the database
            FlowModel.objects.filter(pk=flow_id).delete()
            return JsonResponse({
                'message': 'DELETE successful'
            }, safe=False)
        else:
            return JsonResponse({
                'message': request.method + ' not yet handled.'
            }, status=405)
    except (WorkflowException) as e:
        return JsonResponse({e.action: e.reason}, status=500)
    except ParameterValidationError as e:
        return JsonResponse({'message': str(e)}, status=500)

    return response
