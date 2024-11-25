# ----- Global constants ------
const ħ2ome = 76.2 # meV reference
const μB = 5.8e-2 #meV (ħ²/mₑ)
const Φ0 = 2.05e-15 # T.m² (h/2e)

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
@with_kw struct Params @deftype Float64
    L  = Inf # nm
    a0 = 10.0 # nm
    m0 = 0.023 # InAs
    Nm::Int = 1 # transversal modes
end

# --- Mininal Oreg-Lutchyn's Majorana nanowire ----
build_minimal_wire(; kw...) = build_minimal_wire(Params(; kw...))
function build_minimal_wire(p::Params)
    @unpack L, a0, m0 = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)

    lat = LP.linear(; a0=10.0)

    modelN = @onsite((; μ=0.0, Vz=0.0) -> (2*t-μ)*σ0τz + Vz*σzτz) - hopping(t*σ0τz)
    modelS = @onsite((; Δ0=0.0) -> Δ0*σyτy)
    modelSOC = @hopping((r, dr; α=0.0) -> α*(im*dr[1]/(2a0^2))*σyτz)
    model = modelN + modelS + modelSOC

    h = lat |> hamiltonian(model, orbitals=4)

    if isfinite(L) h=supercell(h, region = r -> 0 <= r[1] <= L) end

    return h
end

# --- Self-consistent intrinsic nanowire (w/ multimode) ---
build_selfconsistent_intrinsic_wire(; kw...) = build_selfconsistent_intrinsic_wire(Params(; kw...))
function build_selfconsistent_intrinsic_wire(p::Params)
    @unpack L, a0, m0, Nm = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)
    µsh = Nm==1 ? 0.0 : 2t*cos(π/(1+Nm))

    lat = Nm==1 ? LP.linear(; a0=10.0) : LP.square(; a0=10.0) |> supercell((1,0), (0, Nm)) |> supercell((1,0))

    modelN = @onsite((; μ=0.0, Vz=0.0) -> (2*t-μ-µsh)*σ0τz + Vz*σzτz) - hopping(t*σ0τz)
    modelS = @onsite((; Δ0=0.0) -> Δ0*σyτy)
    modelSOC = @hopping((r, dr; α=0.0) -> α*(im*dr[1]/(2a0^2))*σyτz) 
    modelSOCt = @hopping( (r, dr; αt=0.0) -> -αt*(im*dr[2]/(2a0^2))*σxτ0) 
    model = modelN + modelS + modelSOC
    if Nm>1 model += modelSOCt end

    HFB! = @onsite!((o, i; U=0.0, ρ=missing) --> o + U * HFBfy!(ρ, i))
    hHFB = lat |> hamiltonian(model, orbitals=4) |> HFB! 

    if isfinite(L) hHFB=supercell(hHFB, region = r -> 0 <= r[1] <= L) end

    return hHFB
end

# --- Hybrid infinite nanowire ---
build_selfconsistent_hybrid_wire(; kw...) = build_selfconsistent_hybrid_wire(Params(; kw...))
function build_selfconsistent_hybrid_wire(p::Params)
    @unpack L, a0, m0 = p
    t = ħ2ome/(2m0*a0^2) #meV (ħ²/mₑ)
    µsh = 2t*cos(π/3) #shallow µ    

    # SC substract (bottom) with SM thin-film (top)
    lat = LP.square(; a0=10) |> supercell((1,0), (0, 2)) |> supercell((1,0))

    modelN = @onsite((r; μ_SC=0.0, μ_SM=0.0, Vz=0.0, τ=1.0) -> (2t - ifelse(iszero(r[2]), μ_SC, μ_SM) - τ*µsh)*σ0τz  + Vz*σzτz)  - @hopping((r, dr; τ=1.0) -> t*ifelse(iszero(dr[1]), τ, 1.0)*σ0τz)
    modelS = @onsite((r; Δ0=0.0, Δ0_SM=0.0) -> ifelse(iszero(r[2]), Δ0, Δ0_SM)*σyτy)
    modelSOC = @hopping((r, dr; α_SC=0.0, α_SM=0.0) -> ifelse(iszero(r[2]), α_SC, α_SM)*(im*dr[1]/(2a0^2))*σyτz)
    model = modelN + modelS + modelSOC

    HFB! = @onsite!((o, i; U_SC=0.0, U_SM=0.0, ρ=missing) --> o + ifelse(iszero(pos(i)[2]), U_SC, U_SM) * HFBfy!(ρ, i))
    hHFB = lat |> hamiltonian(model, orbitals = 4) |> HFB!
    
    if isfinite(L) hHFB=supercell(hHFB, region = r -> 0 <= r[1] <= L) end

    return hHFB
end