#pragma once

#include <JuceHeader.h>
#include <map>
#include <optional>
#include <vector>

class AudioEngine;

class OfflineRenderer : public juce::Thread
{
public:
    struct RenderConfig
    {
        enum class Format { WAV, AIFF, FLAC, MP3, OGG };

        Format format { Format::WAV };
        int sampleRate { 44100 };
        int bitDepth { 24 };
        bool dither { true };
        bool normalize { false };
        float normalizeLevel { -1.0f }; // dB
        std::optional<juce::Range<double>> timeRange;
        bool renderStems { false };
        std::vector<std::string> stemTrackIds;
    };

    struct Progress
    {
        double progress { 0.0 };
        juce::String currentStage;
        double estimatedTimeRemaining { 0.0 };
    };

    OfflineRenderer(AudioEngine& engineRef);

    bool renderProject(const RenderConfig& config, const juce::File& outputFile);
    std::map<std::string, juce::File> renderStems(const RenderConfig& config,
                                                  const juce::File& outputDirectory);

    Progress getProgress() const;
    void cancel();

private:
    void run() override;

    void renderMaster(const RenderConfig& config, juce::AudioBuffer<float>& buffer);
    void renderStem(const std::string& trackId,
                    const RenderConfig& config,
                    juce::AudioBuffer<float>& buffer);
    void processOfflineBlock(juce::AudioBuffer<float>& buffer,
                             double startTime,
                             int numSamples);

    AudioEngine& engine;
    std::atomic<bool> shouldCancel { false };
    std::atomic<double> currentProgress { 0.0 };
    RenderConfig pendingConfig {};
    juce::File pendingOutput;
    bool isStems { false };
    std::vector<std::string> stemIds;
};

