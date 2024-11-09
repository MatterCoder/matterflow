import click
import json
from matterflow import Workflow, WorkflowException
from matterflow import NodeException
from matterflow.nodes import ReadCsvNode, WriteCsvNode, ReadJsonNode, WriteJsonNode, WsConnectionNode, WriteJsonToS3Node, BatchPutToSitewiseNode, MqttConnectionInNode
import asyncio
import time
import io
import os

from matterflow.connection import *

#If running in home assistant addon we will ignore the warnings
if 'HASSIO_TOKEN' in os.environ:
    import warnings
    warnings.filterwarnings("ignore")

class Config(object):
    def __init__(self):
        self.verbose = False


pass_config = click.make_pass_decorator(Config, ensure=True)

async def useMqttConnectionForConsuming(filenames, verbose, mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings):
    mqtt_connection = ConnectionFactory.create_connection("Mqtt", mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings)

    print("started useMqttConnectionForConsuming")
    await mqtt_connection.connect()

async def useMqttConnectionForReading(filenames, verbose, mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings):
    mqtt_connection = ConnectionFactory.create_connection("Mqtt", mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings)
    print("started useMqttConnectionForReading")

    while True:
        message = await mqtt_connection.read_input()
        input = json.dumps(message)
        in_stream = io.BytesIO(input.encode('utf-8'))
        sys.stdin = io.TextIOWrapper(in_stream, encoding='utf-8')        
        await execute_async(filenames, verbose)
        await asyncio.sleep(0.1)

async def useWsConnectionForConsuming(filenames, verbose, websocket_connection_settings, websocket_input_settings, websocket_output_settings):
    websocket_connection = ConnectionFactory.create_connection("Websocket", websocket_connection_settings, websocket_input_settings, websocket_output_settings)

    print("started useWsConnectionForConsuming")
    await websocket_connection.connect()

async def useWsConnectionForReading(filenames, verbose, websocket_connection_settings, websocket_input_settings, websocket_output_settings):
    websocket_connection = ConnectionFactory.create_connection("Websocket", websocket_connection_settings, websocket_input_settings, websocket_output_settings)
    print("started useWsConnectionForReading")

    while True:
        message = await websocket_connection.read_input()
        input = json.dumps(message)
        in_stream = io.BytesIO(input.encode('utf-8'))
        sys.stdin = io.TextIOWrapper(in_stream, encoding='utf-8')        
        await execute_async(filenames, verbose)
        await asyncio.sleep(0.1)

async def usePeriodicTask(filenames, verbose, interval=5):
    """This task runs periodically every `0.1` seconds."""
    while True:
        # Your periodic action here
        print("Periodic task is running...")
        await execute_async(filenames, verbose)
        
        # Sleep for the specified interval before running again
        await asyncio.sleep(interval)

async def run_all_periodic_flows(filenames, verbose, interval=5):

    """ Start concurrent tasks and join  together """
    print("Begin to start tasks...")

    async with asyncio.TaskGroup() as tasks:

        # Execute each workflow in the args
        for workflow_file in filenames:

            if workflow_file is None:
                click.echo('Please specify a workflow to run', err=True)
                return

            try:
                workflow = open_workflow(workflow_file)
                execution_order = workflow.execution_order()
                node_to_execute = workflow.get_node(execution_order[0])

                ##create the periodic task
                tasks.create_task(usePeriodicTask(filenames, verbose, interval))  # Runs every 5 seconds

            except OSError as e:
                click.echo(f"Issues loading workflow file: {e}", err=True)
            except WorkflowException as e:
                click.echo(f"Issues during workflow execution\n{e}", err=True)

    results = []

    print(f"All periodic flows done")

    return results

async def run_all_ws_flows(filenames, verbose):

    """ Start concurrent tasks and join  together """
    print("Begin to start tasks...")

    async with asyncio.TaskGroup() as tasks:

        # Execute each workflow in the args
        for workflow_file in filenames:

            if workflow_file is None:
                click.echo('Please specify a workflow to run', err=True)
                return

            try:
                workflow = open_workflow(workflow_file)
                execution_order = workflow.execution_order()
                node_to_execute = workflow.get_node(execution_order[0])

                if node_to_execute.name == 'Matter WS Connection (In)':
    #                connection_settings = json.loads(node_to_execute.option_values["connection"])
    #                input_settings = json.loads(node_to_execute.option_values["input"])

                    # Example usage "WS"
                    connection_settings = {
                        "Client ID": "client123",
                        "Connection Timeout": 60,
                        "Keep Alive": 120,
                        "host": "127.0.0.1",
                        "port": 5580,
                        "Clean Session": True
                    }
                    #Check if we are running as part of HASSIO (Home assistant IO)
                    #as then we will use the matter server home assistant
                    if 'HASSIO_TOKEN' in os.environ:
                        connection_settings["host"] = 'local-matterflow'

                    input_settings = {
                        "Topic": "#",
                        "Include Topic": True,
                        "Payload Type": "JSON"
                    }
                    output_settings = {
                        "Topic": "sensors/response",
                        "QoS": 1,
                        "Named Root": "sensor_data",
                        "Retain": False,
                        "Breakup Arrays": False,
                        "Template": "{temperature}",
                        "AWS IoT Core": False
                    }    

                    ##create the tasks
                    tasks.create_task(useWsConnectionForConsuming(filenames, verbose, connection_settings, input_settings, output_settings))
                    tasks.create_task(useWsConnectionForReading(filenames, verbose, connection_settings, input_settings, output_settings))
                elif node_to_execute.name == 'MQTT Connection (In)':
                    connection_settings = json.loads(node_to_execute.option_values["connection"])
                    input_settings  = json.loads(node_to_execute.option_values["input"])
                    output_settings = {"Topic": "sensors/response","QoS": 1,"Named Root": "sensor_data","Retain": False,"Breakup Arrays": False,"Template": "{temperature}","AWS IoT Core": False}    

                    ##create the tasks
                    tasks.create_task(useMqttConnectionForConsuming(filenames, verbose, connection_settings, input_settings, output_settings))
                    tasks.create_task(useMqttConnectionForReading(filenames, verbose, connection_settings, input_settings, output_settings))

            except OSError as e:
                click.echo(f"Issues loading workflow file: {e}", err=True)
            except WorkflowException as e:
                click.echo(f"Issues during workflow execution\n{e}", err=True)
            except Exception as e:
                click.echo(f"Issues during workflow execution\n{e}", err=True)


    results = []


    print(f"All flows done")

    return results

@click.group()
def event():
    pass


# You can run this program with 
# matterflow execute /tmp/ae5727c6-c9c9-4b0e-adf1-46b34dd870d9.json --verbose (for websocket initiated flows)
# matterflow execute /tmp/ae5727c6-c9c9-4b0e-adf1-46b34dd870d9.json --verbose --interval 5 (for periodic initiated flows e.g. 5 secs)
@event.command()
@click.argument('filenames', type=click.Path(exists=True), nargs=-1)
@click.option('--verbose', is_flag=True, help='Enables verbose mode.')
@click.option('--interval', default=0)
def execute(filenames, verbose, interval):
    if (interval > 0):
        asyncio.run(run_all_periodic_flows(filenames, verbose, interval=5))
    else:
        asyncio.run(run_all_ws_flows(filenames, verbose))


async def execute_async(filenames, verbose):
    """Execute Workflow file(s)."""
    # Check whether to log to terminal, or redirect output
    log = click.get_text_stream('stdout').isatty()

    # Execute each workflow in the args
    for workflow_file in filenames:

        if workflow_file is None:
            click.echo('Please specify a workflow to run', err=True)
            return

        if log:
            click.echo('Loading workflow file from %s' % workflow_file)

        try:
            workflow = open_workflow(workflow_file)
            execute_workflow(workflow, log, verbose)
        except OSError as e:
            click.echo(f"Issues loading workflow file: {e}", err=True)
        except WorkflowException as e:
            click.echo(f"Issues during workflow execution\n{e}", err=True)

def execute_workflow(workflow, log, verbose):
    """Execute a workflow file, node-by-node.

    Retrieves the execution order from the Workflow and iterates through nodes.
    If any I/O nodes are present AND stdin/stdout redirection is provided in the
    command-line, overwrite the stored options and then replace before saving.

    Args:
        workflow - Workflow object loaded from file
        log - True, for outputting to terminal; False for stdout redirection
        verbose - True, for outputting debug information; False otherwise
    """
    execution_order = workflow.execution_order()

    # Execute each node in the order returned by the Workflow
    for node in execution_order:
        try:
            node_to_execute = workflow.get_node(node)
            original_file_option = pre_execute(workflow, node_to_execute, log)

            if verbose:
                print('Executing node of type ' + str(type(node_to_execute)))

            # perform execution
            executed_node = workflow.execute(node)

            # If file was replaced with stdin/stdout, restore original option
            if original_file_option is not None:
                executed_node.option_values["file"] = original_file_option

            # Update Node in Workflow with changes (saved data file)
            workflow.update_or_add_node(executed_node)
        except NodeException as e:
            click.echo(f"Issues during node execution\n{e}", err=True)

    if verbose:
        click.echo('Completed workflow execution!')


def pre_execute(workflow, node_to_execute, log):
    """Pre-execution steps, to overwrite file options with stdin/stdout.

    If stdin is not a tty, and the Node is ReadCsv, replace file with buffer.
    If stdout is not a tty, and the Node is WriteCsv, replace file with buffer.

    Args:
        workflow - Workflow object loaded from file
        node_to_execute - The Node to execute
        log - True, for outputting to terminal; False for stdout redirection
    """
    stdin = click.get_text_stream('stdin')


    if type(node_to_execute) is ReadCsvNode and not stdin.isatty():
        new_file_location = stdin
    elif type(node_to_execute) is WriteCsvNode and not log:
        new_file_location = click.get_text_stream('stdout')
    elif type(node_to_execute) is ReadJsonNode and not stdin.isatty():
        #new_file_location = stdin
        return None
    elif type(node_to_execute) is WriteJsonNode and not log:
        #this is important as we dont want to use stdin for files that are writing out to the file system
        return None
    elif type(node_to_execute) is WriteJsonToS3Node and not log:
        #this is important as we dont want to use stdin for files that are writing out to the file system
        return None
    elif type(node_to_execute) is BatchPutToSitewiseNode and not log:
        #this is important as we dont want to use stdin for files that are writing out to the file system
        return None
    elif type(node_to_execute) is WsConnectionNode and not stdin.isatty():
        new_file_location = stdin
    elif type(node_to_execute) is MqttConnectionInNode and not stdin.isatty():
        new_file_location = stdin
    else:
        # No file redirection needed
        return None

    # save original file info
    original_file_option = node_to_execute.option_values["file"]

    # replace with value from stdin and save
    node_to_execute.option_values["file"] = new_file_location
    workflow.update_or_add_node(node_to_execute)

    return original_file_option


def open_workflow(workflow_file):
    with open(workflow_file) as f:
        json_content = json.load(f)

    return Workflow.from_json(json_content['matterflow'])
