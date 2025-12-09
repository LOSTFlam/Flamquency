#include "PluginHost.h"
#include <algorithm>

PluginHost::PluginHost()
{
    // Register default formats (VST3/AU if available)
    addDefaultFormats();

    pluginScanCache = juce::File::getSpecialLocation(juce::File::userApplicationDataDirectory)
                          .getChildFile("flamquency")
                          .getChildFile("plugin_scan.cache");
}

void PluginHost::scanPluginsAsync(std::function<void(double)> progressCb)
{
    auto formats = getFormats();
    for (int i = 0; i < formats.getNumFormats(); ++i)
    {
        auto* format = formats.getUnchecked(i);
        juce::StringArray paths;
        format->searchPathsForPlugins(paths, format->getDefaultLocationsToSearch(), true, false);

        double total = (double) paths.size();
        double count = 0.0;

        for (const auto& path : paths)
        {
            juce::OwnedArray<juce::PluginDescription> pluginDescriptions;
            format->findAllTypesForFile(pluginDescriptions, path);
            for (auto* desc : pluginDescriptions)
                knownPlugins.addType(*desc);
            count += 1.0;
            if (progressCb)
                progressCb(count / std::max(1.0, total));
        }
    }

    knownPlugins.saveToFile(pluginScanCache);
}

std::unique_ptr<juce::AudioPluginInstance> PluginHost::createPluginInstance(const juce::PluginDescription& desc,
                                                                            double sampleRate,
                                                                            int blockSize,
                                                                            juce::String& errorMessage)
{
    for (int i = 0; i < getNumFormats(); ++i)
    {
        auto* format = getFormat(i);
        if (format->getName() == desc.pluginFormatName)
            return format->createPluginInstance(desc, sampleRate, blockSize, errorMessage);
    }
    errorMessage = "Plugin format not found: " + desc.pluginFormatName;
    return nullptr;
}

void PluginHost::changeListenerCallback(juce::ChangeBroadcaster* source)
{
    juce::ignoreUnused(source);
    // Placeholder for reacting to plugin list changes
}

void PluginHost::monitorPluginResources()
{
    // TODO: track CPU/latency per plugin, potentially move to sandboxed process
}

