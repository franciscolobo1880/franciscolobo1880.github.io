#!/usr/bin/env -S julia --project

## SBATCH --nodes=1
#SBATCH --partition=most
#SBATCH --ntasks=192
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=2G
#SBATCH --output="hybrid_infinite.out"

# Launch workers
using Distributed
const maxprocs = 96
addprocs(max(0, maxprocs + 1 - nworkers()))

# Load packages
import Serialization
@everywhere begin
    using Quantica
    using HartreeFockWires
    using SIAMFANLEquations
    Quantica.BLAS.set_num_threads(1)
end

# --- Self-consistency simulations ---
@everywhere params = (; L=Inf, a0=10.0, αSC=0.0, αSM=40.0, g=0.17, τ=0.8, μSC=10.0, USC=-32.0) # nm & meV (ħ²/mₑ)

@everywhere μs = range(-9.07-1.0, -9.07+1.0, 144)
@everywhere Vzs = range(0, 1.0, 144)

@everywhere begin
    Quantica.BLAS.set_num_threads(1)

    h = build_meanfield_hybrid_wire(L=params.L, a0=params.a0)
    ΣMF = build_meanfield_selfenergies(greenfunction(h, GS.Schur()), nothing; params...)
    fp(Vz, μ) = calculate_fixedpoint(ΣMF; params..., Vz, μ)
end

begin
    @time sols = rasterscan_fixedpoint(fp, Vzs, μs)
    path = "/home/lobo/.julia/dev/HartreeFockWires/analysis/hybrid_$params.dat" 
    Serialization.serialize(path, (params, Vzs, μs, sols))
end

# -- cleanup --
println("Finished!")
rmprocs(workers())
