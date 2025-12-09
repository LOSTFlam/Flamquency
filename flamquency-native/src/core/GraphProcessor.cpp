#include "GraphProcessor.h"
#include "AudioEngine.h"
#include "../processors/TrackProcessor.h"

GraphProcessor::GraphProcessor()
{
    audioInputNode = addNode(std::make_unique<juce::AudioProcessorGraph::AudioGraphIOProcessor>(
        juce::AudioProcessorGraph::AudioGraphIOProcessor::audioInputNode));
    audioOutputNode = addNode(std::make_unique<juce::AudioProcessorGraph::AudioGraphIOProcessor>(
        juce::AudioProcessorGraph::AudioGraphIOProcessor::audioOutputNode));
}

juce::AudioProcessorGraph::Node::Ptr GraphProcessor::addTrackNode(const TrackConfig& cfg)
{
    auto processor = std::make_unique<TrackProcessor>(cfg.numInputs, cfg.numOutputs);
    auto node = addNode(std::move(processor));
    if (node != nullptr)
    {
        // Connect track to output by default (stereo)
        connectChannels(node->nodeID, audioOutputNode->nodeID, 0, 0);
        connectChannels(node->nodeID, audioOutputNode->nodeID, 1, 1);
    }
    return node;
}

bool GraphProcessor::connectChannels(NodeID src, NodeID dst, int srcChannel, int dstChannel)
{
    return addConnection({ { src, (juce::uint32) srcChannel }, { dst, (juce::uint32) dstChannel } });
}

void GraphProcessor::rebuild()
{
    // Placeholder hook to rebuild connections safely.
}

