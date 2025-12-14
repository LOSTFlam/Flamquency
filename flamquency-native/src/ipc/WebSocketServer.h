#pragma once

#include <JuceHeader.h>
#include <functional>
#include <unordered_set>

// Stub WebSocket server: placeholder for IPC bridge. Replace with a real websocketpp/libwebsockets impl.
class WebSocketServer : private juce::Thread
{
public:
    using MessageHandler = std::function<void(const juce::String&)>;

    WebSocketServer(int port, MessageHandler onMessage);
    ~WebSocketServer() override;

    void start();
    void stop();

    void broadcast(const juce::String& json);

private:
    void run() override;

    int port;
    MessageHandler onMessage;
    std::atomic<bool> running { false };
    juce::WaitableEvent stopEvent;
};

