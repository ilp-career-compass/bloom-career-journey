export class SarvamStreamingService {
    private ws: WebSocket | null = null;
    private isConnected = false;
    private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;
    // Use environment variable for production, fallback to localhost for dev
    private url = import.meta.env.VITE_SARVAM_PROXY_URL || 'ws://127.0.0.1:8000/ws/stream';

    constructor() { }

    /**
     * Connect to the backend proxy
     */
    connect(
        languageCode: string,
        onTranscript: (text: string, isFinal: boolean) => void,
        onError: (error: string) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            this.onTranscriptCallback = onTranscript;
            this.onErrorCallback = onError;

            try {
                const socketUrl = `${this.url}?language_code=${languageCode}`;
                console.log('🔌 [SarvamService] Connecting to:', socketUrl);
                this.ws = new WebSocket(socketUrl);

                this.ws.onopen = () => {
                    console.log('✅ [SarvamService] Connected');
                    this.isConnected = true;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        console.warn('⚠️ [SarvamService] Failed to parse message:', event.data);
                    }
                };

                this.ws.onerror = (event) => {
                    console.error('❌ [SarvamService] WebSocket Error:', event);
                    this.isConnected = false;
                    if (this.onErrorCallback) this.onErrorCallback('Connection error');
                    reject(new Error('WebSocket connection failed'));
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 [SarvamService] Disconnected:', event.code, event.reason);
                    this.isConnected = false;
                };

            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Send audio chunk (PCM Int16 Base64) to proxy
     */
    sendAudioChunk(base64Audio: string) {
        if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            console.log(`📤 Sending ${base64Audio.length} chars to Proxy`);
            this.ws.send(base64Audio);
        } else {
            console.warn('⚠️ Cannot send audio: WebSocket NOT OPEN', this.ws?.readyState);
        }
    }

    /**
     * Handle incoming messages from Sarvam (via Proxy)
     */
    private handleMessage(data: any) {
        console.log('📩 [SarvamService] RAW Message:', JSON.stringify(data));

        // Extract transcript text from various possible formats
        let transcriptText = "";

        // SCENARIO 1: Documented Sarvam Streaming Format (Current)
        if (data.type === 'data' && data.data && data.data.transcript) {
            transcriptText = data.data.transcript;
        }
        // SCENARIO 2: Flat transcript format
        else if (data.transcript) {
            transcriptText = data.transcript;
        }
        // SCENARIO 3: Legacy/Alternative format
        else if (data.text) {
            transcriptText = data.text;
        }
        // SCENARIO 4: Valid 'transcript' event type
        else if (data.type === 'transcript' && data.text) {
            transcriptText = data.text;
        }

        if (transcriptText) {
            // Handle "Hello" vs "Hello." duplicates? 
            // Ideally we just pass what we get. The UI appends it.
            console.log('📝 Extracted Transcript:', transcriptText);
            if (this.onTranscriptCallback) {
                this.onTranscriptCallback(transcriptText, true);
            }
        }

        // Handle events
        if (data.type === 'speech_start' || (data.type === 'events' && data.data?.signal_type === 'START_SPEECH')) {
            console.log('🎤 [SarvamService] Speech Started');
        } else if (data.type === 'speech_end' || (data.type === 'events' && data.data?.signal_type === 'END_SPEECH')) {
            console.log('mb [SarvamService] Speech Ended');
        }
    }

    disconnect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('🛑 [SarvamService] Sending STOP command...');
            try {
                this.ws.send('STOP'); // Signal backend to flush buffer
            } catch (e) {
                console.error('⚠️ [SarvamService] Failed to send STOP:', e);
            }

            // Wait for flush response before closing
            // Increased to 2500ms to allow round-trip time for final transcript
            setTimeout(() => {
                if (this.ws) {
                    console.log('🔌 [SarvamService] Closing connection now (timeout reached).');
                    this.ws.close();
                    this.ws = null;
                }
            }, 2500);
        } else {
            // Already closed or connecting
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
        }
        this.isConnected = false;
    }
}

export const sarvamStreamingService = new SarvamStreamingService();
