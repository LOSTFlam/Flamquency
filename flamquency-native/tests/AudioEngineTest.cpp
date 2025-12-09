#include "core/AudioEngine.h"
#include <iostream>

int main()
{
    FlamquencyAudioEngine engine;
    DeviceConfig cfg;
    if (!engine.initialize(cfg))
    {
        std::cerr << "Failed to init engine\n";
        return 1;
    }
    std::cout << "Engine initialized\n";
    return 0;
}

