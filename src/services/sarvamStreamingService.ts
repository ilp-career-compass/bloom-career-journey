import { logger } from '@/lib/logger';

export class SarvamStreamingService {
    private ws: WebSocket | null = null;
    private isConnected = false;
    private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;
    private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
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

            // G2/G3: Cancel any pending flush timer and close any existing WS before opening a new one
            if (this.disconnectTimer) {
                clearTimeout(this.disconnectTimer);
                this.disconnectTimer = null;
            }
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.isConnected = false;

            try {
                const socketUrl = `${this.url}?language_code=${languageCode}`;
                logger.log('🔌 [SarvamService] Connecting to:', socketUrl);
                this.ws = new WebSocket(socketUrl);

                this.ws.onopen = () => {
                    logger.log('✅ [SarvamService] Connected');
                    this.isConnected = true;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        logger.warn('⚠️ [SarvamService] Failed to parse message:', event.data);
                    }
                };

                this.ws.onerror = (event) => {
                    logger.error('❌ [SarvamService] WebSocket Error:', event);
                    this.isConnected = false;
                    if (this.onErrorCallback) this.onErrorCallback('Connection error');
                    reject(new Error('WebSocket connection failed'));
                };

                this.ws.onclose = (event) => {
                    logger.log('🔌 [SarvamService] Disconnected:', event.code, event.reason);
                    this.isConnected = false;
                    // 1000 = normal closure (we sent STOP + closed intentionally).
                    // Any other code means an unexpected drop — notify the UI.
                    if (event.code !== 1000 && this.onErrorCallback) {
                        this.onErrorCallback(`Connection lost (code ${event.code})`);
                    }
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
            logger.log(`📤 Sending ${base64Audio.length} chars to Proxy`);
            this.ws.send(base64Audio);
        } else {
            logger.warn('⚠️ Cannot send audio: WebSocket NOT OPEN', this.ws?.readyState);
        }
    }

    /**
     * Handle incoming messages from Sarvam (via Proxy)
     */
    private handleMessage(data: any) {
        logger.log('📩 [SarvamService] RAW Message:', JSON.stringify(data));

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
            // G7: Detect partial vs final. Sarvam may include is_final on the wrapper or inner object.
            // Default to true (treat as final) when the flag is absent.
            const isFinal: boolean = data.is_final !== false && data.data?.is_final !== false;
            logger.log('📝 Extracted Transcript:', transcriptText, 'isFinal:', isFinal);
            if (this.onTranscriptCallback) {
                this.onTranscriptCallback(transcriptText, isFinal);
            }
        }

        // Handle events
        if (data.type === 'speech_start' || (data.type === 'events' && data.data?.signal_type === 'START_SPEECH')) {
            logger.log('🎤 [SarvamService] Speech Started');
        } else if (data.type === 'speech_end' || (data.type === 'events' && data.data?.signal_type === 'END_SPEECH')) {
            logger.log('🎤 [SarvamService] Speech Ended');
        }
    }

    disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (this.disconnectTimer) {
                clearTimeout(this.disconnectTimer);
                this.disconnectTimer = null;
            }

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                logger.log('🛑 [SarvamService] Sending STOP command...');
                try {
                    this.ws.send('STOP'); // Signal backend to flush buffer
                } catch (e) {
                    logger.error('⚠️ [SarvamService] Failed to send STOP:', e);
                }

                // G8: Resolve only after Sarvam has had time to flush the final transcript
                this.disconnectTimer = setTimeout(() => {
                    this.disconnectTimer = null;
                    if (this.ws) {
                        logger.log('🔌 [SarvamService] Closing connection now (flush complete).');
                        this.ws.close(1000);
                        this.ws = null;
                    }
                    resolve();
                }, 2500);
            } else {
                if (this.ws) {
                    this.ws.close(1000);
                    this.ws = null;
                }
                resolve();
            }
            this.isConnected = false;
        });
    }
}

export const sarvamStreamingService = new SarvamStreamingService();
