import React from 'react';
import ReactDOM from 'react-dom';

import DevicesSelector from './Components/DevicesSelector';

import loadingSVG from './loading.svg';

import './index.css';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            constraints: {
                audioInput: null,
                audioOutput: null,
                videoInput: null
            },
            stream: null,
            videoTagRef: React.createRef(),
            loadingStream: false,
            error: null
        }
    }

    startStream = () => {
        const stateConstraints = this.state.constraints,
              videotag = this.state.videoTagRef.current;

        this.setState({ loadingStream: true });
        navigator.mediaDevices.getUserMedia({
            video: stateConstraints.videoInput ? {
                deviceId: [ stateConstraints.videoInput.deviceId ],
                width: { ideal: 1280 }
            } : false,
            audio: stateConstraints.audioInput || false
        }).then(stream => {
            this.setState({ stream, loadingStream: false });
            videotag.srcObject = stream;
            videotag.play();
        }).catch(error => this.setState({ error: 'Unable to retrieve audio/video stream with your your current configuration', loadingStream: false }));
    }

    stopStream = () => {
        const { stream } = this.state;
        if (stream)
            stream.getTracks().map(track => track.stop());
        this.setState({ stream: null });
    }

    updateCallback = (constraints, type, objName) => {
        const { stream, videoTagRef } = this.state;
        console.log('update constraints', constraints);
        this.setState({ constraints });

        if (stream) {
            if (type === 'audioinput') {
                const track = stream.getAudioTracks()[0];
                track.stop();
                stream.removeTrack(track);
                navigator.mediaDevices.getUserMedia({ audio: constraints.audioInput, video: false }).then(newStream => stream.addTrack(newStream.getAudioTracks()[0])).catch(console.error);
            } else if (type === 'videoinput') {
                const track = stream.getVideoTracks()[0];
                track.stop();
                stream.removeTrack(track);
                navigator.mediaDevices.getUserMedia({ 
                    audio: false, 
                    video: { deviceId: [ constraints.videoInput.deviceId ], width: { ideal: 1280 } }
                }).then(newStream => stream.addTrack(newStream.getVideoTracks()[0])).catch(console.error);
            } else if (type === 'audiooutput') {
                console.log(type, constraints.audioOutput.deviceId);
                videoTagRef.current.setSinkId(constraints.audioOutput.deviceId).catch(error => this.setState({ error: 'Error: cant change speaker' }));
            } else console.log('nothing');
        }
    }

    render() {
        const { error, constraints, stream, loadingStream, videoTagRef } = this.state;
        return ( 
            <div className='app'>
                <DevicesSelector constraints={constraints} stream={stream} videoTagRef={videoTagRef} updateCallback={this.updateCallback}>
                    {stream ? <button onClick={this.stopStream}>Stop capture</button> : <button onClick={this.startStream}>Start capture</button>}
                </DevicesSelector>
                <div className='stream'>
                    {loadingStream ? <img src={`dist/${loadingSVG}`} alt="loading svg"/> : null}
                    {error ? error.toString() : ''}
                    <video className={stream ? 'show' : 'hide'} ref={videoTagRef} autoPlay={true}></video>
                </div>
            </div>
        )
    }
}

ReactDOM.render(<App />, document.querySelector('#root'));