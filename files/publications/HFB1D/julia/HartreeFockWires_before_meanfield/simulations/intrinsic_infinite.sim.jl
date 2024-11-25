#!/usr/bin/env -S julia --project

## SBATCH --nodes=1
#SBATCH --partition=all
#SBATCH --ntasks=192
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=2G
#SBATCH --output="results/output/intrisinc_infinite.out"

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

# ----- Self-consistency simulations -----
@everywhere params = (; L=Inf, Nm=1, α=40.0, αt=0.0, a0=10.0, U=-7.85) # nm & meV (ħ²/mₑ)

@everywhere μs = range(2.6, 4.65, 144)  #mev (ħ²/mₑ)
@everywhere Vzs = range(0, 1.0, 144)   #mev (ħ²/mₑ)

@everywhere begin
    Quantica.BLAS.set_num_threads(1)

    hHFB = build_selfconsistent_intrinsic_wire(L=params.L, Nm=params.Nm, a0=params.a0)
    Sf = serializer(Float64, hHFB, siteselector(); encoder=NambuEncoder, decoder=NambuDecoder)
end

begin
    fixedpoint_scanner_V = (Vz, μ) -> fixedpoint(Sf, GS.Schur(); params..., m=1, beta=0.8, Vz, μ)
    @time seis = selfconsistency(fixedpoint_scanner_V, Vzs, μs)
    Serialization.serialize("results/data/intrinsic_$params.dat", (params, Vzs, μs, seis))
end

# -- cleanup --
println("Finished!")
rmprocs(workers())
