cmake_minimum_required(VERSION 3.20)
project(flamquency_native LANGUAGES CXX)

# Expect JUCE as a submodule in thirdparty/JUCE
set(JUCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/thirdparty/JUCE")
list(APPEND CMAKE_MODULE_PATH "${JUCE_DIR}/extras/Build/CMake")
find_package(JUCE CONFIG REQUIRED)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

juce_add_library(flamquency_engine STATIC
    PRODUCT_NAME "Flamquency Engine"
    ICON_BIG ""
    ICON_SMALL ""
    COMPANY_NAME "Flamquency"
    VERSION "0.1.0"
    SOURCES
        src/core/AudioEngine.cpp
        src/core/AudioEngine.h
        src/core/GraphProcessor.cpp
        src/core/GraphProcessor.h
        src/core/Transport.cpp
        src/core/Transport.h
        src/core/Metronome.cpp
        src/core/Metronome.h
        src/plugin/PluginHost.cpp
        src/plugin/PluginHost.h
        src/plugin/PresetManager.cpp
        src/plugin/PresetManager.h
        src/mixer/TrackManager.cpp
        src/mixer/TrackManager.h
        src/mixer/AutomationManager.cpp
        src/mixer/AutomationManager.h
        src/mixer/OfflineRenderer.cpp
        src/mixer/OfflineRenderer.h
        src/utils/LockFreeQueue.h
)

target_include_directories(flamquency_engine PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)

target_link_libraries(flamquency_engine
    PRIVATE
        juce::juce_audio_basics
        juce::juce_audio_devices
        juce::juce_audio_processors
        juce::juce_audio_utils
        juce::juce_core
        juce::juce_data_structures
        juce::juce_dsp
        juce::juce_events
)

# Minimal test target placeholder (can be expanded with Catch2/GoogleTest)
add_executable(engine_smoke tests/AudioEngineTest.cpp)
target_link_libraries(engine_smoke PRIVATE flamquency_engine)

