#include "PresetManager.h"
#include <algorithm>

void PresetManager::scanFactoryPresets()
{
    // TODO: iterate known plugin preset folders and fill pluginPresets
}

void PresetManager::importUserPresets(const juce::File& directory)
{
    userPresetsDirectory = directory;
    // TODO: parse user preset files; format depends on target plugins
}

std::vector<PresetManager::Preset> PresetManager::searchPresets(const juce::String& query,
                                                                const juce::String& pluginId,
                                                                const juce::StringArray& tags)
{
    std::vector<Preset> results;
    for (const auto& kv : pluginPresets)
    {
        if (!pluginId.isEmpty() && kv.first != pluginId.toStdString())
            continue;
        for (const auto& preset : kv.second)
        {
            const bool nameMatch = preset.name.containsIgnoreCase(query);
            const bool tagMatch = tags.isEmpty() || std::any_of(tags.begin(), tags.end(), [&](const juce::String& t) {
                return preset.tags.contains(t);
            });
            if (nameMatch && tagMatch)
                results.push_back(preset);
        }
    }
    return results;
}

std::vector<PresetManager::Preset> PresetManager::recommendPresets(const ProjectContext& context)
{
    juce::ignoreUnused(context);
    // TODO: plug AI/semantic logic; currently returns top-rated
    std::vector<Preset> results;
    for (const auto& kv : pluginPresets)
        for (const auto& preset : kv.second)
            results.push_back(preset);

    std::sort(results.begin(), results.end(), [](const Preset& a, const Preset& b) { return a.rating > b.rating; });
    return results;
}

