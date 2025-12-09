#pragma once

#include <JuceHeader.h>
#include <functional>
#include <unordered_map>

struct ParameterInfo
{
    juce::String id;
    juce::String name;
    float minValue { 0.0f };
    float maxValue { 1.0f };
    float defaultValue { 0.0f };
    bool isAutomatable { true };
};

struct Preset
{
    juce::String name;
    juce::String pluginId;
    juce::MemoryBlock state;
    juce::String category;
    juce::StringArray tags;
    double rating { 0.0 };
};

class PluginHost : public juce::AudioPluginFormatManager,
                   public juce::ChangeListener
{
public:
    struct PluginInfo
    {
        juce::PluginDescription desc;
        juce::String category;
        juce::String manufacturer;
        std::vector<ParameterInfo> parameters;
        std::vector<Preset> factoryPresets;
        bool isInstrument { false };
        bool hasGUI { false };
        int latencySamples { 0 };
        double cpuUsageEstimate { 0.0 };
    };

    PluginHost();
    ~PluginHost() override = default;

    // Scanning
    void scanPluginsAsync(std::function<void(double)> progressCb);

    // Loading
    std::unique_ptr<juce::AudioPluginInstance> createPluginInstance(const juce::PluginDescription& desc,
                                                                    double sampleRate,
                                                                    int blockSize,
                                                                    juce::String& errorMessage);

    // ChangeListener
    void changeListenerCallback(juce::ChangeBroadcaster* source) override;

    const juce::KnownPluginList& getKnownPlugins() const { return knownPlugins; }
    juce::KnownPluginList& getKnownPlugins() { return knownPlugins; }

private:
    juce::KnownPluginList knownPlugins;
    juce::File pluginScanCache;
    std::unique_ptr<juce::FileLogger> scanLogger;

    void monitorPluginResources(); // placeholder
};

