/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Component, createRef } from 'react';

export default class Comments extends Component {
  commentBox: any;

  constructor(props) {
    super(props);
    this.commentBox = createRef();
  }

  componentDidMount() {
    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://utteranc.es/client.js';
    scriptEl.async = true;
    scriptEl.setAttribute('repo', 'WandersonLontra/IGNITE_CHALLENGE1_CHAPTER3');
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', 'photon-dark');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    this.commentBox.current.appendChild(scriptEl);
  }

  render(): JSX.Element {
    return (
      <div style={{ width: '100%', margin: '5rem auto' }} id="comments">
        <div ref={this.commentBox} className="comment-box" />
      </div>
    );
  }
}
