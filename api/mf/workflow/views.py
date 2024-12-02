import os
import json
import sys

from django.http import JsonResponse, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from matterflow import Workflow, WorkflowException
from drf_yasg.utils import swagger_auto_schema

from modulefinder import ModuleFinder


@swagger_auto_schema(method='post',
                     operation_summary='Create a new workflow.',
                     operation_description='Creates a new workflow with empty DiGraph.',
                     responses={
                         200: 'Created new DiGraph'
                     })
@api_view(['POST'])
def new_workflow(request):
    """Create a new workflow.

    Initialize a new, empty, NetworkX DiGraph object and store it in the session.

    Return:
        200 - Created new DiGraph
    """
    try:
        workflow_id = json.loads(request.body)

        # Create new Workflow
        request.matterflow = Workflow(name=workflow_id['id'], root_dir=settings.MEDIA_ROOT)
        request.session.update(request.matterflow.to_session_dict())

        return JsonResponse(Workflow.to_graph_json(request.matterflow.graph))
    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({'No React model ID provided': str(e)}, status=500)

@swagger_auto_schema(method='post',
                     operation_summary='Activates a workflow from db.',
                     operation_description='Loads a JSON file from db and translates into Workflow object and JSON object of front-end',
                     responses={
                         200: 'Workflow representation in JSON',
                         400: 'No file specified',
                         404: 'File specified not found or not JSON graph'
                     })
@api_view(['POST'])
def activate_workflow(request):
    """Activates a workflow.

    User changes flow and passes JSON data to be
    parsed and validated on the back-end.

    Args:
        request: Django request Object, should follow the pattern:
            {
                react: {react-diagrams JSON},
                matterflow: {
                    name: Workflow name,
                    root_dir: File storage,
                    graph: Computational graph,
                    flow_vars: Global flow variables,
                },
            }

    Raises:
        JSONDecodeError: invalid JSON data
        KeyError: request missing either 'react' or 'matterflow' data
        WorkflowException: error loading JSON into NetworkX DiGraph

    Returns:
        200 - JSON response with data.
        400 - No file specified
        404 - File specified not found, or not JSON graph
        500 - Missing JSON data or
    """
    
    try:
        # TODO: file is parsed into JSON in memory;
        #       may want to save to 'fs' for large files
        #if we have a file upload
        uploaded_json = request.body
        flow_json_string = json.loads(uploaded_json)['data']['json_data']
        combined_json = json.loads(flow_json_string)
        request.matterflow = Workflow.from_json(combined_json['matterflow'])
        request.session.update(request.matterflow.to_session_dict())

        # Send back front-end workflow
        return JsonResponse(combined_json)
    except KeyError as e:
        return JsonResponse({'open_workflow': 'Missing data for ' + str(e)}, status=500)
    except json.JSONDecodeError as e:
        return JsonResponse({'No React JSON provided': str(e)}, status=500)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=404)



@swagger_auto_schema(method='post',
                     operation_summary='Open workflow from file.',
                     operation_description='Loads a JSON file from disk and translates into Workflow object and JSON object of front-end',
                     responses={
                         200: 'Workflow representation in JSON',
                         400: 'No file specified',
                         404: 'File specified not found or not JSON graph'
                     })
@api_view(['POST'])
def open_workflow(request):
    """Open a workflow.

    User uploads a JSON file to the front-end that passes JSON data to be
    parsed and validated on the back-end.

    Args:
        request: Django request Object, should follow the pattern:
            {
                react: {react-diagrams JSON},
                matterflow: {
                    name: Workflow name,
                    root_dir: File storage,
                    graph: Computational graph,
                    flow_vars: Global flow variables,
                },
            }

    Raises:
        JSONDecodeError: invalid JSON data
        KeyError: request missing either 'react' or 'matterflow' data
        WorkflowException: error loading JSON into NetworkX DiGraph

    Returns:
        200 - JSON response with data.
        400 - No file specified
        404 - File specified not found, or not JSON graph
        500 - Missing JSON data or
    """
    
    try:
        # TODO: file is parsed into JSON in memory;
        #       may want to save to 'fs' for large files
        #if we have a file upload
        uploaded_file = request.FILES.get('file')
        combined_json = json.load(uploaded_file)

        request.matterflow = Workflow.from_json(combined_json['matterflow'])
        request.session.update(request.matterflow.to_session_dict())

        # Send back front-end workflow
        return JsonResponse(combined_json['react'])
    except KeyError as e:
        return JsonResponse({'open_workflow': 'Missing data for ' + str(e)}, status=500)
    except json.JSONDecodeError as e:
        return JsonResponse({'No React JSON provided': str(e)}, status=500)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=404)


@swagger_auto_schema(method='post',
                     operation_summary='Edit workflow information',
                     operation_description='Edits workflow information.',
                     responses={
                         200: 'Workflow info updated',
                         500: 'No valid JSON in request body'
                     })
@api_view(['POST'])
def edit_workflow(request):
    try:
        json_data = json.loads(request.body)
        request.matterflow.name = json_data['name']

        return JsonResponse({'message': 'Workflow successfully updated.'})
    except Exception as e:
        return JsonResponse({'message': str(e)}, status=404)


@swagger_auto_schema(method='post',
                     operation_summary='Save workflow to JSON file',
                     operation_description='Saves workflow to JSON file for download.',
                     responses={
                         200: 'Workflow representation in JSON',
                         400: 'No file specified',
                         404: 'File specified not found or not JSON graph',
                         500: 'No valid JSON in request body'
                     })
@api_view(['POST'])
def save_workflow(request):
    """Save workflow.

    Saves a workflow to disk.

    Args:
        request: Django request Object

    Returns:
        Downloads JSON file representing graph.
    """
    # Load session data into Workflow object. If successful, return
    # serialized graph
    try:
        combined_json = json.dumps({
            'filename': request.matterflow.filename,
            'react': json.loads(request.body),
            'matterflow': {
                'name': request.matterflow.name,
                'root_dir': request.matterflow.root_dir,
                'graph': Workflow.to_graph_json(request.matterflow.graph),
                'flow_vars': Workflow.to_graph_json(request.matterflow.flow_vars),
            }
        })

        return HttpResponse(combined_json, content_type='application/json')
    except json.JSONDecodeError as e:
        return JsonResponse({'No React JSON provided': str(e)}, status=500)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=404)

@swagger_auto_schema(method='post',
                     operation_summary='Save workflow to server as JSON file',
                     operation_description='Saves workflow to JSON file on server',
                     responses={
                         200: 'Workflow representation in JSON',
                         400: 'No file specified',
                         404: 'File specified not found or not JSON graph',
                         500: 'No valid JSON in request body'
                     })
@api_view(['POST'])
def save_workflow_to_server(request):
    """Save workflow.

    Saves a workflow to disk on server.

    Args:
        request: Django request Object

    Returns:
        Downloads JSON file representing graph.
    """
    # Load session data into Workflow object. If successful, return
    # serialized graph
    try:
        combined_json = json.dumps({
            'filename': request.matterflow.filename,
            'react': json.loads(request.body),
            'matterflow': {
                'name': request.matterflow.name,
                'root_dir': request.matterflow.root_dir,
                'graph': Workflow.to_graph_json(request.matterflow.graph),
                'flow_vars': Workflow.to_graph_json(request.matterflow.flow_vars),
            }
        })
        # here we are going to save workflow file in server

        # Create the process
        #1. Create the workflow process file
        #2. Add the file to the conf
        #3. Restart the supervisord

        #1. Create the workflow file
        TMP_DIR_PATH = os.getenv('DIR_PATH') or '/tmp'
        workflow_filename = f"{TMP_DIR_PATH}/{request.matterflow.filename}"
        f = open(workflow_filename, "w")
        f.write(combined_json)
        f.close()

        #2. Add the file to the supervisord in supervisor_confs folder       
        dir_path = os.path.dirname(os.path.realpath(__file__))
        supervisord_filename = f"{TMP_DIR_PATH}/{request.matterflow.filename}.conf"
        f = open(supervisord_filename, "w")
        f.write(f'''[program:{request.matterflow.name}]
command=/bin/bash -c "source {dir_path}/../../venv/bin/activate && matterflow execute {workflow_filename} --verbose"
''')
#        f.write(f'''[program:{request.matterflow.name}]
#command=/bin/cat
#''')        
        f.close()

        return HttpResponse(combined_json, content_type='application/json')
    except json.JSONDecodeError as e:
        return JsonResponse({'No React JSON provided': str(e)}, status=500)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=404)

@swagger_auto_schema(method='get',
                     operation_summary='Retrieve sorted list of node execution.',
                     operation_description='Retrieves a list of nodes, sorted in execution order.',
                     responses={
                         200: 'List of nodes, sorted in execution order.',
                         404: 'No graph exists.',
                         500: 'Error generating the topological sort for the graph.'
                     })
@api_view(['GET'])
def execute_workflow(request):
    """Execute workflow.

    Generates a list of all nodes in the NetworkX DiGraph topologically sorted.

    Returns:
        List of nodes, sorted in execution order.
    """
    try:
        order = request.matterflow.execution_order()
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=500)

    return JsonResponse(order, safe=False)


@swagger_auto_schema(method='get',
                     operation_summary='Retrieve list of global flow vars.',
                     operation_description='Retrieves a list of global flow vars.',
                     responses={
                         200: 'List of global flow variables.',
                         404: 'No graph exists.',
                         500: 'Error generating the topological sort for the graph.'
                     })
@api_view(['GET'])
def global_vars(request):
    graph_data = Workflow.to_graph_json(request.matterflow.flow_vars)
    return JsonResponse(graph_data["nodes"], safe=False)


@swagger_auto_schema(method='get',
                     operation_summary='Retrieve sorted list of successors from a node.',
                     operation_description='Retrieves a list of successor nodes, sorted in execution order.',
                     responses={
                         200: 'List of successor nodes, sorted in execution order.',
                         404: 'No graph exists.',
                         500: 'Error retrieving list of successors for the graph.'
                     })
@api_view(['GET'])
def get_successors(request, node_id):
    """Get sorted list of Node successors.

    Generates a list of all nodes in the NetworkX DiGraph topologically sorted.

    Returns:
        List of nodes, sorted in execution order.
    """
    try:
        order = request.matterflow.get_node_successors(node_id)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=500)

    return JsonResponse(order, safe=False)


@swagger_auto_schema(method='post',
                     operation_summary='Uploads a file to server.',
                     operation_description='Uploads a new file to server location.',
                     responses={
                         200: 'File uploaded',
                         404: 'No specified file'
                     })
@api_view(['POST'])
def upload_file(request):
    f = request.FILES.get('file')

    if f is None:
        return JsonResponse("Empty content", status=404)

    try:
        node_id = request.POST.get('nodeId')

        if node_id is None:
            # custom node file
            file_path = request.matterflow.node_path('custom_nodes', f.name)
        else:
            # node data file
            file_path = request.matterflow.path(f"{node_id}-{f.name}")

        save_name = Workflow.upload_file(f, file_path)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=500)

    return JsonResponse({"filename": save_name}, status=201, safe=False)


@swagger_auto_schema(method='get',
                     operation_summary='Retrieve a list of installed Nodes',
                     operation_description='Retrieves a list of installed Nodes, in JSON.',
                     responses={
                         200: 'List of installed Nodes, in JSON',
                     })
@api_view(['GET'])
def retrieve_nodes_for_user(request):
    """Assembles list of Nodes accessible to workflows.

    Retrieve a list of classes from the Node module in `matterflow`.
    List is split into 'types' (e.g., 'IO' and 'Manipulation') and
    'keys', or individual command Nodes (e.g., 'ReadCsv', 'Pivot').
    """
    data = request.matterflow.get_packaged_nodes()
    return JsonResponse(data, safe=False)


@swagger_auto_schema(method='post',
                     operation_summary='Downloads a file from the server',
                     operation_description='Downloads a file associated with Node from server.',
                     responses={
                         200: 'File downloaded',
                         404: 'Could not read specified file'
                     })
@api_view(['POST'])
def download_file(request):
    try:
        # Retrieve Node info, and related File object
        json_data = json.loads(request.body)
        f = request.matterflow.download_file(json_data['node_id'])

        # Parse file type
        _, ext = os.path.splitext(f.name)
        if ext == ".csv":
            content = "text/csv"
        elif ext == ".json":
            content = "application/json"
        else:
            content = "application/octet-stream"

        # Construct response
        response = HttpResponse(content_type=content)
        response['Content-Disposition'] = os.path.basename(f.name)
        response.write(f.read())

        # File not opened with `with`; need to close
        f.close()
        return response
    except OSError:
        return JsonResponse({"message": "Could not find or read file"},
                            status=404)
    except WorkflowException as e:
        return JsonResponse({e.action: e.reason}, status=500)
