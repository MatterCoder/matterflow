import { DefaultLinkModel } from '@projectstorm/react-diagrams';
import * as API from '../../API';

export default class MFLinkModel extends DefaultLinkModel {
    constructor() {
        super({
          type: 'default',
          width: 2,
          color: 'black'
        });
        this.registerListener({
            targetPortChanged: event => {
                console.log(event);
                //we are using a listener in the workspace.jsx now
                //API.addEdge(this).catch(() => {}); 
            },
        })
    }

    getSVGPath() {
      if (this.isLastPositionDefault()) {
        return;
      }

      return super.getSVGPath();
    }

    isLastPositionDefault() {
      return this.getLastPoint().getX() === 0 && this.getLastPoint().getY() === 0;
    }

    remove() {
        API.deleteEdge(this)
            .catch(() => {});

        //important to call super.remove after we have deleted as the source and target port will be erased.
        super.remove();
    }
}
