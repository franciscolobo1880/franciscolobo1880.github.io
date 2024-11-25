#!/usr/bin/env -S julia --project

## SBATCH --nodes=1
#SBATCH --partition=all
#SBATCH --ntasks=192
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=2G
#SBATCH --output="results/output/hybrid_infinite.out"

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
@everywhere params = (; L=Inf, α_SM=40.0, a0=10.0, U_SC=-30.0, μ_SC=20.0, τ=0.8) # nm & meV (ħ²/mₑ)

@everywhere μs_SM = range(-8.9, -6.9, 144) #mev (ħ²/mₑ)
@everywhere Vzs = range(0, 1.0, 144)       #mev (ħ²/mₑ)

@everywhere begin
    Quantica.BLAS.set_num_threads(1)

    hHFB = build_selfconsistent_hybrid_wire(L=params.L, a0=params.a0)
    Sf = serializer(Float64, hHFB, siteselector(); encoder=NambuEncoder, decoder=NambuDecoder)
end

begin
    fixedpoint_scanner_V = (Vz, μ_SM) -> fixedpoint(Sf, GS.Schur(); params..., m=1, beta=0.8, Vz, μ_SM)
    @time seis = selfconsistency(fixedpoint_scanner_V, Vzs, μs_SM)
    Serialization.serialize("results/data/hybrid_$params.dat", (params, Vzs, μs_SM, seis))
end

# -- cleanup --
println("Finished!")
rmprocs(workers())
