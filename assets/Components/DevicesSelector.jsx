import React from 'react';

import './devicesselector.css';

export default class DevicesSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            constraints: props.constraints || {
                audioInput: null,
                audioOutput: null,
                videoInput: null
            },
            permissions: {
                microphone: null,
                camera: null
            },
            devices: {
                audioInput: [],
                audioOutput: [],
                videoInput: []
            },
            children: props.children || null
        }
        this.updateCallback = props.updateCallback;
    }

    getConnectedDevices = async (type) => {
        const devices = await navigator.mediaDevices.enumerateDevices().catch(error => this.setState({ error }));
        return devices.filter(device => device.kind === type);
    }

    async selectDefaultAudio() {
        const { constraints, devices } = this.state;
        devices.audioInput = await this.getConnectedDevices('audioinput').catch(error => this.setState({ error }));
        devices.audioOutput = await this.getConnectedDevices('audiooutput').catch(error => this.setState({ error }));

        constraints.audioInput = devices.audioInput[0];
        constraints.audioOutput = devices.audioOutput[0];
        this.setState({ constraints, devices });
    }

    async selectDefaultVideo() {
        const { constraints, devices } = this.state;
        devices.videoInput = await this.getConnectedDevices('videoinput').catch(error => this.setState({ error }));

        constraints.videoInput = devices.videoInput[0];
        this.setState({ constraints, devices });
    }

    async selectDevice(event, type, objName) {
        event.persist();
        const { constraints, devices } = this.state;
        devices[objName] = await this.getConnectedDevices(type).catch(error => this.setState({ error }));

        const newDevice = devices[objName].filter(d => d.deviceId === event.target.value)[0];
        constraints[objName] = newDevice;
        this.setState({ constraints, devices });

        console.log(constraints.audioOutput.deviceId);
        this.updateCallback(constraints, type, objName);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.constraints !== state.constraints || props.children !== state.children) {
            return { constraints: props.constraints, children: props.children }
        } else
            return { constraints: props.constraints, children: props.children }
    }

    componentDidMount = async () => {
        const audioQuery = await navigator.permissions.query({ name: 'microphone' }).catch(error => this.setState({ error: 'Error: Unable to retrieve microphone permission' }));
        const checkAudioPermission = async (state) => {
            console.log('Microphone permission', state);
            if (state === 'granted') {
                this.selectDefaultAudio();
                const { permissions } = this.state;
                permissions.microphone = 'granted';
                this.setState({ permissions });
            } else if (state === 'prompt') {
                const audioTracks = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).catch(error => console.warn('Permission denied for microphone access'));
                if (audioTracks) {
                    audioTracks.getTracks().map(track => track.stop());
                    this.selectDefaultAudio();
                    const { permissions } = this.state;
                    permissions.microphone = 'granted';
                    this.setState({ permissions });
                } else {
                    const { permissions } = this.state;
                    permissions.microphone = 'denied';
                    this.setState({ permissions });
                }
            } else if (state === 'denied') {
                const { permissions } = this.state;
                permissions.microphone = 'denied';
                this.setState({ permissions });
            }
        }
        checkAudioPermission(audioQuery.state);
        audioQuery.onchange = ({ currentTarget }) => checkAudioPermission(currentTarget.state);

        const videoQuery = await navigator.permissions.query({ name: 'camera' }).catch(error => this.setState({ error: 'Error: Unable to retrieve camera permission' }));
        const checkVideoPermission = async (state) => {
            console.log('Camera permission', state);
            if (state === 'granted') {
                this.selectDefaultVideo();
                const { permissions } = this.state;
                permissions.camera = 'granted';
                this.setState({ permissions });
            } else if (state === 'prompt') {
                const videoTracks = await navigator.mediaDevices.getUserMedia({ audio: false, video: true }).catch(error => console.warn('Permission denied for camera access'));
                if (videoTracks) {
                    videoTracks.getTracks().map(track => track.stop());
                    this.selectDefaultVideo();
                    const { permissions } = this.state;
                    permissions.camera = 'granted';
                    this.setState({ permissions });
                } else {
                    const { permissions } = this.state;
                    permissions.camera = 'denied';
                    this.setState({ permissions });
                }
            } else if (state === 'denied') {
                const { permissions } = this.state;
                permissions.camera = 'denied';
                this.setState({ permissions });
            }
        }
        checkVideoPermission(videoQuery.state);
        videoQuery.onchange = ({ currentTarget }) => checkVideoPermission(currentTarget.state);

        if (audioQuery.state === 'denied' && videoQuery.state === 'denied')
            this.setState({ error: 'Microphone and camera permissions are denied' });
    }

    render() {
        const { devices, constraints, permissions, children } = this.state;
        return (
            <div className='devices-selector'>
                <div className='field'>
                    <label>Microphone</label>
                    {permissions.microphone === 'granted' && constraints.audioInput ? 
                    <select defaultValue={constraints.audioInput.deviceId} onChange={(e) => this.selectDevice(e, 'audioinput', 'audioInput')}>
                        {devices.audioInput.map((device, key) => <option key={key} value={device.deviceId}>{device.label}</option>)}
                    </select> : 
                    <select disabled={true}>
                        <option>No audio input available</option>
                    </select>}
                </div>
                <div className='field'>
                    <label>Speaker</label>
                    {permissions.microphone === 'granted' && constraints.audioOutput ? 
                    <select defaultValue={constraints.audioOutput.deviceId} onChange={(e) => this.selectDevice(e, 'audiooutput', 'audioOutput')}>
                        {devices.audioOutput.map((device, key) => <option key={key} value={device.deviceId}>{device.label}</option>)}
                    </select> : 
                    <select disabled={true}>
                        <option>No audio output available</option>
                    </select>}
                </div>
                <div className='field'>
                    <label>Camera</label>
                    {permissions.camera === 'granted' && constraints.videoInput ? 
                    <select defaultValue={constraints.videoInput.deviceId} onChange={(e) => this.selectDevice(e, 'videoinput', 'videoInput')}>
                        {devices.videoInput.map((device, key) => <option key={key} value={device.deviceId}>{device.label}</option>)}
                    </select> : 
                    <select disabled={true}>
                        <option>No video input available</option>
                    </select>}
                </div>
                {children}
            </div>
        )
    }
}