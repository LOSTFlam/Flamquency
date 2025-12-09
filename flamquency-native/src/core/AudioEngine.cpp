#include "AudioEngine.h"
#include "Transport.h"
#include "Metronome.h"
#include "GraphProcessor.h"

FlamquencyAudioEngine::FlamquencyAudioEngine() = default;
FlamquencyAudioEngine::~FlamquencyAudioEngine()
{
    if (deviceManager)
        deviceManager->removeAudioCallback(this);
}

bool FlamquencyAudioEngine::initialize(const DeviceConfig& config)
{
    deviceManager = std::make_unique<juce::AudioDeviceManager>();
    juce::AudioDeviceManager::AudioDeviceSetup setup;
    setup.bufferSize = config.bufferSize;
    setup.sampleRate = config.sampleRate;
    setup.outputDeviceName = config.outputDeviceName;
    setup.useDefaultInputChannels = false;
    setup.useDefaultOutputChannels = true;

    auto* type = deviceManager->getAvailableDeviceTypes().getFirst();
    deviceManager->setCurrentAudioDeviceType(type->getTypeName(), true);

    const auto result = deviceManager->initialise(0, config.numOutputChannels, nullptr, true, {}, &setup);
    if (result.isNotEmpty())
        return false;

    currentSampleRate = deviceManager->getCurrentAudioDevice()->getCurrentSampleRate();
    currentBlockSize = deviceManager->getCurrentAudioDevice()->getCurrentBufferSizeSamples();

    mainGraph = std::make_unique<GraphProcessor>();
    transport = std::make_unique<TransportController>();
    metronome = std::make_unique<Metronome>();

    processorPlayer = std::make_unique<juce::AudioProcessorPlayer>();
    processorPlayer->setProcessor(mainGraph.get());
    deviceManager->addAudioCallback(this);

    rebuildGraph();
    updateLatency();
    return true;
}

NodeID FlamquencyAudioEngine::addTrackProcessor(const TrackConfig& config)
{
    auto node = mainGraph->addTrackNode(config);
    if (node != nullptr)
        trackNodes.emplace(node->nodeID, node);
    return node != nullptr ? node->nodeID : NodeID{};
}

bool FlamquencyAudioEngine::connectNodes(NodeID source, NodeID dest, int sourceChannel, int destChannel)
{
    return mainGraph->connectChannels(source, dest, sourceChannel, destChannel);
}

void FlamquencyAudioEngine::play()
{
    transport->play();
}

void FlamquencyAudioEngine::stop()
{
    transport->stop();
}

void FlamquencyAudioEngine::setPosition(double seconds)
{
    transport->setPosition(seconds, true);
}

void FlamquencyAudioEngine::setLoop(double start, double end)
{
    transport->setLoop(start, end);
}

void FlamquencyAudioEngine::setTempo(double bpm)
{
    transport->setTempo(bpm);
}

FlamquencyAudioEngine::PerformanceMetrics FlamquencyAudioEngine::getMetrics() const
{
    PerformanceMetrics m;
    if (deviceManager)
        m.latencyMs = deviceManager->getCurrentAudioDevice()->getOutputLatencyInSamples() * 1000.0 / currentSampleRate;
    m.cpuUsage = juce::Time::getMillisecondCounterHiRes(); // placeholder
    m.xruns = xrunCount.load();
    return m;
}

void FlamquencyAudioEngine::audioDeviceIOCallback(const float** inputChannelData, int numInputChannels,
                                                  float** outputChannelData, int numOutputChannels,
                                                  int numSamples)
{
    juce::ignoreUnused(inputChannelData, numInputChannels);
    if (processorPlayer)
        processorPlayer->audioDeviceIOCallback(inputChannelData, numInputChannels,
                                               outputChannelData, numOutputChannels,
                                               numSamples);
    else
        for (int ch = 0; ch < numOutputChannels; ++ch)
            juce::FloatVectorOperations::clear(outputChannelData[ch], numSamples);
}

void FlamquencyAudioEngine::audioDeviceAboutToStart(juce::AudioIODevice* device)
{
    currentSampleRate = device->getCurrentSampleRate();
    currentBlockSize = device->getCurrentBufferSizeSamples();
    if (processorPlayer)
        processorPlayer->audioDeviceAboutToStart(device);
}

void FlamquencyAudioEngine::audioDeviceStopped()
{
    if (processorPlayer)
        processorPlayer->audioDeviceStopped();
}

void FlamquencyAudioEngine::changeListenerCallback(juce::ChangeBroadcaster* source)
{
    juce::ignoreUnused(source);
    // Hook for device change notifications
}

void FlamquencyAudioEngine::rebuildGraph()
{
    if (mainGraph)
        mainGraph->rebuild();
}

void FlamquencyAudioEngine::updateLatency()
{
    if (!deviceManager) return;
    if (auto* dev = deviceManager->getCurrentAudioDevice())
        currentBlockSize = dev->getCurrentBufferSizeSamples();
}

