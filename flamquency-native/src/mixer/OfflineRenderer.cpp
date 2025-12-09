#include "OfflineRenderer.h"
#include "../core/AudioEngine.h"

OfflineRenderer::OfflineRenderer(AudioEngine& engineRef)
    : juce::Thread("OfflineRenderer"), engine(engineRef)
{
}

bool OfflineRenderer::renderProject(const RenderConfig& config, const juce::File& outputFile)
{
    pendingConfig = config;
    pendingOutput = outputFile;
    isStems = false;
    startThread();
    return true;
}

std::map<std::string, juce::File> OfflineRenderer::renderStems(const RenderConfig& config,
                                                               const juce::File& outputDirectory)
{
    pendingConfig = config;
    pendingOutput = outputDirectory;
    isStems = true;
    stemIds = config.stemTrackIds;
    startThread();
    return {};
}

OfflineRenderer::Progress OfflineRenderer::getProgress() const
{
    return { currentProgress.load(), "rendering", 0.0 };
}

void OfflineRenderer::cancel()
{
    shouldCancel.store(true);
}

void OfflineRenderer::run()
{
    shouldCancel.store(false);
    currentProgress.store(0.0);

    juce::AudioBuffer<float> buffer(2, 8192);

    if (isStems)
    {
        for (size_t i = 0; i < stemIds.size(); ++i)
        {
            if (shouldCancel.load()) break;
            renderStem(stemIds[i], pendingConfig, buffer);
            currentProgress.store((i + 1) / (double) stemIds.size());
        }
    }
    else
    {
        renderMaster(pendingConfig, buffer);
        currentProgress.store(1.0);
    }
}

void OfflineRenderer::renderMaster(const RenderConfig& config, juce::AudioBuffer<float>& buffer)
{
    juce::ignoreUnused(config, buffer);
    // TODO: pull audio from graph offline
}

void OfflineRenderer::renderStem(const std::string& trackId,
                                 const RenderConfig& config,
                                 juce::AudioBuffer<float>& buffer)
{
    juce::ignoreUnused(trackId, config, buffer);
    // TODO: solo track and render
}

void OfflineRenderer::processOfflineBlock(juce::AudioBuffer<float>& buffer,
                                          double startTime,
                                          int numSamples)
{
    juce::ignoreUnused(buffer, startTime, numSamples);
    // TODO: drive audio graph manually for offline bounce
}

