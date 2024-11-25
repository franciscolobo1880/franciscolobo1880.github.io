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

    export build_minimal_wire, build_selfconsistent_intrinsic_wire, build_selfconsistent_hybrid_wire
    export build_selfconsistent_hybrid_infinite_wire, build_selfconsistent_hybrid_finite_wire
    export Nambufy!, HFBfy!, NambuDecoder, NambuEncoder, hρh!, fixedpoint, selfconsistency
    export solver, reconH, gapfix, invariant, analΩ

    include("builders.jl")
    include("selfconsistency.jl")
    include("analysis.jl")

end
