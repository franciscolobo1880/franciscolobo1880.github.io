module HartreeFockWires

    using Parameters
    using Quantica
    using Quantica: MMatrix
    using ProgressMeter
    using LinearAlgebra
    using FixedPoint
    using Statistics
    using ArnoldiMethod
    using LinearMaps
    using SkewLinearAlgebra
    using Distributed
    using SIAMFANLEquations

    # - building the Hamiltonians -
    export build_OregLutchyn_wire, build_meanfield_intrinsic_wire, build_meanfield_hybrid_wire
    # - building the tools for calculate the selfconsistency -
    export Yukawa, cutoff # potential
    export build_meanfield_selfenergies, calculate_fixedpoint, rasterscan_fixedpoint, converged_hMF
    export build_meanfield_selfenergies_noFock, calculate_fixedpoint_npv, converged_hMF_npv
    # - calculations for analysis - 
    export invariant # pfaffian
    export gapfix, solver, calculate_gap, calculate_bands # for convenience
    export BCSΩ, pfaffian_OL, calculate_gap_OL, bandstructure_OL # for comparison

    include("builders.jl")
    include("selfconsistency.jl")
    include("analysis.jl")

end
