#pragma once

#include <JuceHeader.h>
#include <unordered_map>
#include <memory>

class TransportController;
class Metronome;
class GraphProcessor;

// Placeholder types for configuration
struct DeviceConfig
{
    juce::String outputDeviceName {};
    int bufferSize { 256 };
    double sampleRate { 48000.0 };
    int numOutputChannels { 2 };
};

struct TrackConfig
{
    juce::String name { "Track" };
    int numInputs { 2 };
    int numOutputs { 2 };
};

using NodeID = juce::AudioProcessorGraph::NodeID;

class FlamquencyAudioEngine : public juce::AudioIODeviceCallback,
                              public juce::ChangeListener
{
public:
    FlamquencyAudioEngine();
    ~FlamquencyAudioEngine() override;

    bool initialize(const DeviceConfig& config);

    // Graph management
    NodeID addTrackProcessor(const TrackConfig& config);
    bool connectNodes(NodeID source, NodeID dest, int sourceChannel, int destChannel);

    // Transport
    void play();
    void stop();
    void setPosition(double seconds);
    void setLoop(double start, double end);
    void setTempo(double bpm);

    struct PerformanceMetrics
    {
        double cpuUsage { 0.0 };
        double latencyMs { 0.0 };
        int xruns { 0 };
        std::vector<float> trackLevels;
    };

    PerformanceMetrics getMetrics() const;

    // AudioIODeviceCallback
    void audioDeviceIOCallback(const float** inputChannelData, int numInputChannels,
                               float** outputChannelData, int numOutputChannels,
                               int numSamples) override;
    void audioDeviceAboutToStart(juce::AudioIODevice* device) override;
    void audioDeviceStopped() override;

    // ChangeListener
    void changeListenerCallback(juce::ChangeBroadcaster* source) override;

private:
    void rebuildGraph();
    void updateLatency();

    std::unique_ptr<juce::AudioDeviceManager> deviceManager;
    std::unique_ptr<juce::AudioProcessorPlayer> processorPlayer;
    std::unique_ptr<GraphProcessor> mainGraph;
    std::unique_ptr<TransportController> transport;
    std::unique_ptr<Metronome> metronome;

    std::unordered_map<NodeID, juce::AudioProcessorGraph::Node::Ptr> trackNodes;

    double currentSampleRate { 48000.0 };
    int currentBlockSize { 256 };
    mutable std::atomic<int> xrunCount { 0 };
};

