#pragma once

#include <JuceHeader.h>
#include <unordered_map>
#include <vector>

struct ProjectContext
{
    double bpm { 120.0 };
    juce::String genre { "Default" };
    juce::String key { "C" };
};

class PresetManager
{
public:
    struct Preset
    {
        juce::String name;
        juce::String pluginId;
        juce::MemoryBlock state;
        juce::String category;
        juce::StringArray tags;
        double rating { 0.0 };
    };

    void scanFactoryPresets();
    void importUserPresets(const juce::File& directory);

    std::vector<Preset> searchPresets(const juce::String& query,
                                      const juce::String& pluginId = {},
                                      const juce::StringArray& tags = {});

    std::vector<Preset> recommendPresets(const ProjectContext& context);

private:
    std::unordered_map<std::string, std::vector<Preset>> pluginPresets;
    juce::File userPresetsDirectory;
};

