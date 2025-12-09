#pragma once

#include <JuceHeader.h>
#include <unordered_map>

struct TrackConfig;

class GraphProcessor : public juce::AudioProcessorGraph
{
public:
    GraphProcessor();
    ~GraphProcessor() override = default;

    Node::Ptr addTrackNode(const TrackConfig& cfg);
    bool connectChannels(NodeID src, NodeID dst, int srcChannel, int dstChannel);
    void rebuild();

private:
    Node::Ptr audioInputNode;
    Node::Ptr audioOutputNode;
};

