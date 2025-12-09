#pragma once

#include <JuceHeader.h>
#include <array>

// Simple single-producer/single-consumer lock-free queue using AbstractFifo.
template <typename T, int Capacity>
class LockFreeQueue
{
public:
    bool push(const T& item)
    {
        int start1, size1, start2, size2;
        fifo.prepareToWrite(1, start1, size1, start2, size2);
        if (size1 == 0)
            return false;
        buffer[(size_t) start1] = item;
        fifo.finishedWrite(size1);
        juce::ignoreUnused(start2, size2);
        return true;
    }

    bool pop(T& out)
    {
        int start1, size1, start2, size2;
        fifo.prepareToRead(1, start1, size1, start2, size2);
        if (size1 == 0)
            return false;
        out = buffer[(size_t) start1];
        fifo.finishedRead(size1);
        juce::ignoreUnused(start2, size2);
        return true;
    }

    void reset()
    {
        fifo.reset();
    }

private:
    juce::AbstractFifo fifo { Capacity };
    std::array<T, (size_t) Capacity> buffer {};
};

