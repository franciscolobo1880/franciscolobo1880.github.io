#!/usr/bin/env -S julia --project

## SBATCH --nodes=1
#SBATCH --partition=most
#SBATCH --ntasks=192
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=2G
#SBATCH --output="intrinsic_finite.out"

# Launch workers
using Distributed
using ProgressMeter
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

# ----- Self-consistency simulations -----
@everywhere params = (; L=2000.0, a0=10.0, α=40.0, U=-8.0, λ=0.0) 

@everywhere μs = range(-0.315-1.0, -0.315+1.0, 144) # meV (ħ²/mₑ)
@everywhere Vzs = range(0.0, 1.0, 144) # meV (ħ²/mₑ)

# Yukawa potential
@everywhere V(r) = Yukawa(r; params)
@everywhere params = merge(params, (; nV=cutoff(V; params)))

@everywhere begin
    Quantica.BLAS.set_num_threads(1)

    h = build_meanfield_intrinsic_wire(L=params.L, a0=params.a0, nV=params.nV)
    fp(Vz, μ) = calculate_fixedpoint_npv(h, GS.Spectrum(), V; params..., Vz, μ)
end

begin
    @time sols = rasterscan_fixedpoint(fp, Vzs, μs)
    path = "/home/lobo/.julia/dev/HartreeFockWires/analysis/intrinsic_$(params).dat" 
    Serialization.serialize(path, (params, Vzs, μs, sols))
end

# -- cleanup --
println("Finished!")
rmprocs(workers())