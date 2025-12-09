#include "AutomationManager.h"

float AutomationManager::AutomationLane::getValueAtTime(double time) const
{
    if (points.empty())
        return defaultValue;

    const auto it = std::lower_bound(points.begin(), points.end(), time,
        [](const AutomationPoint& p, double t) { return p.time < t; });

    if (it == points.begin())
        return it->value;
    if (it == points.end())
        return points.back().value;

    const auto& p1 = *(it - 1);
    const auto& p2 = *it;
    const double tNorm = (time - p1.time) / std::max(1e-9, (p2.time - p1.time));
    const float curve = p1.curve;

    if (curve < -0.0001f)
        return p1.value + (p2.value - p1.value) * std::pow(tNorm, 0.5);
    if (curve > 0.0001f)
        return p1.value + (p2.value - p1.value) * (float) (tNorm * tNorm);
    return p1.value + (p2.value - p1.value) * (float) tNorm;
}

void AutomationManager::addPoint(const std::string& trackId,
                                 const std::string& paramId,
                                 const AutomationPoint& point)
{
    const juce::ScopedWriteLock guard(lock);
    auto& lane = lanes[trackId][paramId];
    lane.parameterId = paramId;
    lane.points.push_back(point);
    std::sort(lane.points.begin(), lane.points.end(),
              [](const AutomationPoint& a, const AutomationPoint& b) { return a.time < b.time; });
}

void AutomationManager::updateAutomation(double currentTime)
{
    juce::ignoreUnused(currentTime);
    // Placeholder: in real use, push values to processors
}

std::vector<BezierCurve> AutomationManager::convertToBezier(const std::string& trackId,
                                                            const std::string& paramId) const
{
    const juce::ScopedReadLock guard(lock);
    std::vector<BezierCurve> curves;
    auto tIt = lanes.find(trackId);
    if (tIt == lanes.end()) return curves;
    auto pIt = tIt->second.find(paramId);
    if (pIt == tIt->second.end()) return curves;
    const auto& pts = pIt->second.points;
    if (pts.size() < 2) return curves;

    for (size_t i = 1; i < pts.size(); ++i)
    {
        const auto& a = pts[i - 1];
        const auto& b = pts[i];
        BezierCurve c;
        c.p0 = { (float) a.time, a.value };
        c.p3 = { (float) b.time, b.value };
        // Simple linear handles; UI can refine
        c.p1 = { (float) (a.time + (b.time - a.time) * 0.33), a.value };
        c.p2 = { (float) (a.time + (b.time - a.time) * 0.66), b.value };
        curves.push_back(c);
    }
    return curves;
}

