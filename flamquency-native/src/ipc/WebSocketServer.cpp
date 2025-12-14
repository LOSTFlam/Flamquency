#include "WebSocketServer.h"

WebSocketServer::WebSocketServer(int p, MessageHandler handler)
    : juce::Thread("WebSocketServer"), port(p), onMessage(std::move(handler))
{
}

WebSocketServer::~WebSocketServer()
{
    stop();
}

void WebSocketServer::start()
{
    if (running.exchange(true)) return;
    startThread();
}

void WebSocketServer::stop()
{
    running.store(false);
    stopEvent.signal();
    stopThread(2000);
}

void WebSocketServer::broadcast(const juce::String& json)
{
    juce::ignoreUnused(json);
    // Placeholder: send to connected clients
}

void WebSocketServer::run()
{
    while (running.load())
    {
        // Placeholder: accept connections and read frames
        // Simulate wait
        stopEvent.wait(50);
    }
}

