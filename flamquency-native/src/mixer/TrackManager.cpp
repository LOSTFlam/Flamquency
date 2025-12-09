#include "TrackManager.h"
#include "../processors/TrackProcessor.h"
#include "../core/GraphProcessor.h"
#include <random>

TrackManager::TrackManager(GraphProcessor& g) : graph(g)
{
}

std::string TrackManager::makeId(const std::string& prefix) const
{
    static std::mt19937 rng{ std::random_device{}() };
    return prefix + "-" + std::to_string(rng());
}

std::string TrackManager::createTrack(Track::Type type, const std::string& name)
{
    const juce::ScopedWriteLock lock(tracksLock);
    Track t;
    t.id = makeId("track");
    t.name = name.empty() ? t.id : name;
    t.type = type;

    TrackConfig cfg;
    cfg.name = t.name;
    t.processor = graph.addTrackNode(cfg);

    tracks.emplace(t.id, std::move(t));
    trackOrder.push_back(t.id);
    return trackOrder.back();
}

bool TrackManager::deleteTrack(const std::string& trackId)
{
    const juce::ScopedWriteLock lock(tracksLock);
    auto it = tracks.find(trackId);
    if (it == tracks.end()) return false;
    tracks.erase(it);
    trackOrder.erase(std::remove(trackOrder.begin(), trackOrder.end(), trackId), trackOrder.end());
    return true;
}

bool TrackManager::setTrackOutput(const std::string& trackId, const std::string& outputTrackId)
{
    juce::ScopedWriteLock lock(tracksLock);
    auto it = tracks.find(trackId);
    auto out = tracks.find(outputTrackId);
    if (it == tracks.end() || out == tracks.end()) return false;
    // TODO: connect graph nodes for routing
    it->second.outputBus = 0;
    return true;
}

bool TrackManager::createGroup(const std::vector<std::string>& trackIds, const std::string& groupName)
{
    const juce::ScopedWriteLock lock(tracksLock);
    Track group;
    group.id = makeId("group");
    group.name = groupName.empty() ? group.id : groupName;
    group.type = Track::Type::GROUP;
    TrackConfig cfg;
    cfg.name = group.name;
    group.processor = graph.addTrackNode(cfg);
    tracks.emplace(group.id, group);
    trackOrder.push_back(group.id);

    for (auto& id : trackIds)
    {
        auto it = tracks.find(id);
        if (it != tracks.end())
        {
            it->second.parentGroupId = group.id;
            tracks[group.id].childTrackIds.push_back(id);
        }
    }
    return true;
}

std::vector<TrackManager::Track> TrackManager::getTracksSnapshot() const
{
    const juce::ScopedReadLock lock(tracksLock);
    std::vector<Track> result;
    result.reserve(tracks.size());
    for (const auto& id : trackOrder)
    {
        auto it = tracks.find(id);
        if (it != tracks.end())
            result.push_back(it->second);
    }
    return result;
}

