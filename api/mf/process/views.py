import os
import json
import sys

from matterflow import WorkflowException
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from drf_yasg.utils import swagger_auto_schema
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers

from modulefinder import ModuleFinder
from xmlrpc.client import ServerProxy


@swagger_auto_schema(method='get',
                     operation_summary='Retrieve list of processes.',
                     operation_description='Retrieves a list of processes.',
                     responses={
                         200: 'List of successor processes.',
                         404: 'No processes exists.',
                         500: 'Error retrieving list of processes.'
                     })
@api_view(['GET'])
def get_processes(request):
    """Get sorted list of Processes.

    Generates a list of all processes.

    Returns:
        List of processes.
    """
    try:
        server = ServerProxy('http://localhost:9001/RPC2')
        response = { "data": json.dumps(server.supervisor.getAllProcessInfo())}
        return JsonResponse(response, status=200)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=500)

    return JsonResponse(order, safe=False)

@swagger_auto_schema(method='post',
                     operation_summary='Create a new flow.',
                     operation_description='Creates a new flow.',
                     responses={
                         200: 'Created new flow'
                     })
@api_view(['POST'])
def new_process(request):
    """Create a new process.

    Initialize a new, empty, flow object and store it in the session.

    Return:
        200 - Created new flow
    """
    try:
        json_data = json.loads(request.body)


        server = ServerProxy('http://localhost:9001/RPC2')
        response = { "data": json.dumps(server.supervisor.reloadConfig())}
        response = { "data": json.dumps(server.supervisor.restart())}
        
        return JsonResponse({
            'Message': 'Process Created',
            'Request Body': response
        })
    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'No React flow provided': str(e)}, status=500)


@api_view(['POST'])
def start_process(request):
    try:
        # Get the process name from the request
        process_name = json.loads(request.body)['processName']

        # Create an XML-RPC client
        server = ServerProxy('http://localhost:9001/RPC2')

        # Start the process
        result = server.supervisor.startProcess(process_name)

        # Return the result
        return JsonResponse({'result': result})
    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'Cannot start the process': str(e)}, status=500)

@api_view(['POST'])
def stop_process(request):
    try:
        # Get the process name from the request
        process_name = json.loads(request.body)['processName']

        # Create an XML-RPC client
        server = ServerProxy('http://localhost:9001/RPC2')

        # Start the process
        result = server.supervisor.stopProcess(process_name)

        # Return the result
        return JsonResponse({'result': result})
    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'Cannot stop the process': str(e)}, status=500)


@swagger_auto_schema(method='delete',
                     operation_summary='Delete a process from supervisord',
                     operation_description='Deletes a process from supervisord.',
                     responses={
                         200: 'JSON response with data',
                         400: 'No file specified',
                         404: 'Node/graph not found',
                         405: 'Method not allowed',
                         500: 'Error processing Node change'
                     })
@api_view(['DELETE'])
@csrf_exempt
def delete_process(request):
    """ Delete a process

    Returns:
        200 - flow was found; data in JSON format
        404 - flow does not exist
        405 - Method not allowed
        500 - Error processing flow change
    """

    if request is None:
        return JsonResponse({
            'message': 'The request does not contain a flow id'
        }, status=404)

    # Process request
    print("*******************************")
    print("processing delete process request")
    try:
        if request.method == 'DELETE':
            # Create an XML-RPC client
            try:
                # Get the process name from the request
                process_name = json.loads(request.body)['processName']
                print("processing name:" + process_name)

                # Delete the file to the supervisord in supervisor_confs folder       
                dir_path = os.path.dirname(os.path.realpath(__file__))
                #supervisord_filename = f"{dir_path}/../../supervisor_confs/{process_name}.json.conf"
                supervisord_filename = f"/data/{process_name}.json.conf"
                print("supervisord_filename:" + supervisord_filename)
                os.remove(supervisord_filename)
            except:
                return JsonResponse({
                    'message': 'No process file found'
                }, status=405)

            server = ServerProxy('http://localhost:9001/RPC2')
            response = { "data": json.dumps(server.supervisor.reloadConfig())}
            response = { "data": json.dumps(server.supervisor.restart())}

            #Delete the flow entry from the database
            return JsonResponse({
                'Message': 'DELETE successful',
                'Request Body': response
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
