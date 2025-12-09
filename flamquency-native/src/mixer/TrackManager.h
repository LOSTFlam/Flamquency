#pragma once

#include <JuceHeader.h>
#include <unordered_map>
#include <vector>
#include <optional>
#include <string>
#include "../core/AudioEngine.h"

class TrackProcessor;

class TrackManager
{
public:
    struct Track
    {
        enum class Type { AUDIO, MIDI, GROUP, FX, MASTER };

        std::string id;
        std::string name;
        Type type { Type::AUDIO };
        juce::Colour color { juce::Colours::skyblue };

        std::optional<std::string> parentGroupId;
        std::vector<std::string> childTrackIds;
        int outputBus { 0 }; // 0 = master

        juce::AudioProcessorGraph::Node::Ptr processor;

        bool isMuted { false };
        bool isSoloed { false };
        bool isArmed { false };
        float volumeDb { 0.0f };
        float pan { 0.0f };
    };

    explicit TrackManager(GraphProcessor& graph);

    std::string createTrack(Track::Type type, const std::string& name = {});
    bool deleteTrack(const std::string& trackId);

    bool setTrackOutput(const std::string& trackId, const std::string& outputTrackId);
    bool createGroup(const std::vector<std::string>& trackIds, const std::string& groupName);

    // Automation hook: stores per-track parameter envelopes (implemented in AutomationManager)
    void setAutomationManager(class AutomationManager* mgr) { automation = mgr; }

    std::vector<Track> getTracksSnapshot() const;

private:
    GraphProcessor& graph;
    std::unordered_map<std::string, Track> tracks;
    std::vector<std::string> trackOrder;
    std::vector<Track*> processingOrder;
    mutable juce::ReadWriteLock tracksLock;
    AutomationManager* automation { nullptr };

    std::string makeId(const std::string& prefix) const;
};

