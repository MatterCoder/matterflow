import { NodeModel } from '@projectstorm/react-diagrams';
import MFPortModel from '../MFPort/MFPortModel';

export default class CustomNodeModel extends NodeModel {

    constructor(options = {}, config = {}) {
        super({
            ...options,
            type: 'custom-node'
        });
        
        // Ensure the node is draggable
        this.options.draggable = true;
        
        this.options.node_id = this.options.id;
        this.config = config;
        this.configParams = options.option_types;
        this.options.status = options.status || "unconfigured";

        // add flow control input port
        this.addPort(
            new MFPortModel({
                in: true,
                type: 'mf-port',
                name: 'flow-in'
            })
        );
        // if flow node, add flow control output port
        if (this.options.node_type === "flow_control") {
            this.addPort(
                new MFPortModel({
                    in: false,
                    type: 'mf-port',
                    name: 'flow-out'
                })
            );
        }
        const nIn = options.num_in === undefined ? 1 : options.num_in;
        const nOut = options.num_out === undefined ? 1 : options.num_out;
        // setup in and out ports
        for (let i = 0; i < nIn; ++i) {
            this.addPort(
                new MFPortModel({
                    in: true,
                    type: 'mf-port',
                    name: `in-${i}`
                })
            );
        }
        for (let i = 0; i < nOut; ++i) {
            this.addPort(
                new MFPortModel({
                    in: false,
                    type: 'mf-port',
                    name: `out-${i}`
                })
            );
        }
    }

    getNodeId() {
      return this.options.node_id;
    }

    serialize() {
        return {
            ...super.serialize(),
            options: this.options,
            config: this.config
        }
    }

    deserialize(ob, engine) {
        super.deserialize(ob, engine);
    }

    setStatus(status) {
        this.options.status = status;
    }

    // Add method to handle position updates
    setPosition(x, y) {
        super.setPosition(x, y);
        this.fireEvent({ type: 'positionChanged' }, { x, y });
    }
}
