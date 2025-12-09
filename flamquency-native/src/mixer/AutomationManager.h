#pragma once

#include <JuceHeader.h>
#include <unordered_map>
#include <vector>
#include <optional>
#include <string>

struct BezierCurve
{
    juce::Point<float> p0, p1, p2, p3;
};

class AutomationManager
{
public:
    enum class AutomationCurve { LINEAR, EXPONENTIAL, LOGARITHMIC };

    struct AutomationPoint
    {
        double time { 0.0 }; // seconds
        float value { 0.0f };
        float curve { 0.0f }; // -1 expo, 0 linear, 1 log
        std::optional<std::string> interpolation; // hermite, bezier
    };

    struct AutomationLane
    {
        std::string parameterId;
        std::vector<AutomationPoint> points;
        bool isEnabled { true };
        float defaultValue { 0.0f };

        float getValueAtTime(double time) const;
    };

    void addPoint(const std::string& trackId,
                  const std::string& paramId,
                  const AutomationPoint& point);

    void updateAutomation(double currentTime);

    std::vector<BezierCurve> convertToBezier(const std::string& trackId,
                                             const std::string& paramId) const;

private:
    std::unordered_map<std::string,
        std::unordered_map<std::string, AutomationLane>> lanes;
    mutable juce::ReadWriteLock lock;
};

