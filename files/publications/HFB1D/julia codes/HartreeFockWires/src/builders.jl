# ----- Global constants ------
const ħ2ome = 76.2 # meV reference

const σ0 = SA[1 0; 0 1]
const σx = SA[0 1; 1 0]
const σy = SA[0 -im; im 0]
const σz = SA[1 0; 0 -1]

const σ0τ0 = @SMatrix[1 0 0 0; 0 1 0 0; 0 0 1 0; 0 0 0 1]
const σ0τy = @SMatrix[0 0 -im 0; 0 0 0 -im; im 0 0 0; 0 im 0 0]
const σ0τx = @SMatrix[0 0 1 0; 0 0 0 1; 1 0 0 0; 0 1 0 0]
const σ0τz = @SMatrix[1 0 0 0; 0 1 0 0; 0 0 -1 0; 0 0 0 -1]

const σxτ0 = @SMatrix[0 1 0 0; 1 0 0 0; 0 0 0 1; 0 0 1 0]
const σyτy = @SMatrix[0 0 0 -1; 0 0 1 0; 0 1 0 0; -1 0 0 0]
const σyτx = @SMatrix[0 0 0 -im; 0 0 im 0; 0 -im 0 0; im 0 0 0]
const σyτz = @SMatrix[0 -im 0 0; im 0 0 0; 0 0 0 im; 0 0 -im 0]
const σzτz = @SMatrix[1 0 0 0; 0 -1 0 0; 0 0 -1 0; 0 0 0 1]

# ----- Building Hamiltonians ------
# nU is the Hubbard hopping neighbors range 
# Since it defines the sparsity structure of matrices,
# the hopping range fucntion cannot be parametric.
@with_kw struct Params @deftype Float64
    L  = Inf    # nm
    a0 = 10.0   # nm
    m0 = 0.023  # InAs
    nV = 0      
end

# --- Mininal Oreg-Lutchyn's Majorana nanowire ----
build_OregLutchyn_wire(; kw...) = build_OregLutchyn_wire(Params(; kw...))
function build_OregLutchyn_wire(p::Params)
    @unpack L, a0, m0 = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)

    lat = LP.linear(; a0)

    modelN = @onsite((; μ=0.0, Vz=0.0) -> (2*t-μ)*σ0τz + Vz*σzτz) - hopping(t*σ0τz)
    modelS = @onsite((; Δ0=0.0) -> Δ0*σyτy)
    modelSOC = @hopping((r, dr; α=0.0) -> α*(im*dr[1]/(2a0^2))*σyτz)
    model = modelN + modelSOC + modelS

    h = lat |> hamiltonian(model, orbitals=4)

    if isfinite(L) h=supercell(h, region = r -> 0 <= r[1] <= L) end

    return h
end

# --- Single-mode meanfield intrinsic nanowire with V\---
# Fock hopping to nF neighbors
build_meanfield_intrinsic_wire(; kw...) = build_meanfield_intrinsic_wire(Params(; kw...))
function build_meanfield_intrinsic_wire(p::Params)
    @unpack L, a0, m0, nV = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)

    lat = LP.linear(; a0) |> supercell(Int(nV+1))

    # [Kinectics + Doping] + Zeeman + SOC + Pairing
    modelH = @onsite((; μ=0.0) -> (2*t-μ)*σ0τz) - hopping(t*σ0τz)
    modelZ = @onsite((; Vz=0.0) -> Vz*σzτz)
    modelα = @hopping((r, dr; α=0.0) -> α*(im*dr[1]/(2a0^2))*σyτz) 
    modelΔ = @onsite((; ΔSM=0.0) -> ΔSM*σyτy)
    model0 = modelH + modelZ + modelα + modelΔ

    # Potential V + Onsite U meanfield self-energies 
    ΣHartree = @onsite((i; Σ=zerofield) --> Σ[i]) 
    ΣFock = @hopping((i, j; Σ=zerofield) --> Σ[i, j]; range=nV*a0) 
    model = model0 + ΣHartree + ΣFock

    h = lat |> hamiltonian(model, orbitals=4)
    if isfinite(L) h=supercell(h, region = r -> 0 <= r[1] <= L) end

    return h
end

# --- Meanfield hybrid nanowire ---
# no Fock hoppings in either, no Hubbard on SM
build_meanfield_hybrid_wire(; kw...) = build_meanfield_hybrid_wire(Params(; kw...))
function build_meanfield_hybrid_wire(p::Params)
    @unpack L, a0, m0 = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)
    µsh = 2t*cos(π/3)    #shallow µ    

    # Superconductor at the bottom (r=0) with semiconductor on top
    lat = LP.square(; a0) |> supercell((1,0), (0, 2)) |> supercell((1,0))

    # [Kinectics + Doping] + Zeeman + [SOC + transversal SOC] + Pairing
    # μ≡μ for convenience
    modelH = @onsite((r; μSC=0.0, μ=0.0, τ=1.0) -> (2t - ifelse(iszero(r[2]), μSC, μ) - τ*µsh)*σ0τz) - @hopping((r, dr; τ=1.0) -> t*ifelse(iszero(dr[1]), τ, 1.0)*σ0τz)
    modelZ = @onsite((r; Vz=0.0, g=1.0) -> ifelse(iszero(r[2]), g, 1.0)*Vz*σzτz) #g≡gSM/gSC
    modelα = @hopping((r, dr; αSC=0.0, αSM=0.0) -> ifelse(iszero(r[2]), αSC, αSM)*(im*dr[1]/(2a0^2))*σyτz)
    modelΔ = @onsite((r; ΔSC=0.0, ΔSM=0.0) -> ifelse(iszero(r[2]), ΔSC, ΔSM)*σyτy)    
    model0 = modelH + modelZ + modelα + modelΔ

    # Hubbard U (fixed nU=0) meanfield self-energy 
    ΣHartree = @onsite((i; Σ=zerofield) --> ifelse(iszero(pos(i)[2]), Σ[i], zerofield[i]) )  
    ΣFock = @hopping((i, j; Σ=zerofield) --> ifelse(iszero(pos(i)[2]), Σ[i, j], zerofield[i, j]))
    model = model0 + ΣHartree + ΣFock

    h = lat |> hamiltonian(model, orbitals = 4)
    if isfinite(L) h=supercell(h, region = r -> 0 <= r[1] <= L) end

    return h
end