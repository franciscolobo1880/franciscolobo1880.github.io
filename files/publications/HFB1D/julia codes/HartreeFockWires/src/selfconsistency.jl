# --- Yukawa potential ---
Yukawa(r; params, A=1/2) = params.U*A*exp(-norm(r/params.a0)/params.λ)/norm(r/params.a0)

# --- Neighbour cutoff depending on V ---
# defaults to 0 neighbours for onsite
function cutoff(V; params, pU=1)
    if iszero(params.λ) || isnothing(V)
        return 0
    else
        cut = abs(pU/100 * params.U / log10(params.λ))
        v = [n-1 for n in 2:1e3 if abs(V(n*params.a0)) < cut]
        return Int(first(v))
    end
end

# meanfield() calculates ρ and then, from it, return the next iteration of the self-energy Σ 
function build_meanfield_selfenergies(g::Quantica.GreenFunction{Float64,T,<:Any}, V; params...) where {T}
    # intrinsic case  
    case(::Val{1}) = meanfield(g; charge=HartreeFockWires.σ0τz, nambu=true, namburotation=false, 
    potential=r->V(r), onsite=params[:U], selector=(; range=params[:nV]*params[:a0]))
    # hybrid case
    case(::Val{2}) = meanfield(g; charge=HartreeFockWires.σ0τz, nambu=true, namburotation=false, 
    onsite=params[:USC], selector=(; range=0, region=(r, dr)-> iszero(r[2])))
    return case(Val(T))
end

function build_meanfield_selfenergies_noFock(g::Quantica.GreenFunction{Float64,T,<:Any}, V; params...) where {T}
    case(::Val{1}) = meanfield(g; charge=HartreeFockWires.σ0τz, nambu=true, namburotation=false, 
    potential=r->V(r), onsite=params[:U], selector=(; range=0), fock=0, selector_hartree = (; range=params[:nV]*params[:a0]))
    return case(Val(T))
end

# f(x) = x with initial condition x0 from Anderson acceleration method
# Σ0 functions acts a serializer translator 
function calculate_fixedpoint(ΣMF::Quantica.MeanField; m=1, maxit=100, beta=0.8, atol=1e-7, ΔSC=2.0, ΔSM=0.3, params...)
    Σ0 = ΣMF(μ=0.0, kBT=0.0; params..., ΔSC, ΔSM)
    x0 = serialize(Float64, Σ0)

    function f!(x, x0, (ΣMF, Σ0, params))
        Σnew = Quantica.call!(ΣMF; params..., Σ=deserialize(Σ0, x0))
        copy!(x, serialize(Float64, Σnew))
        return x
    end

    Vstore = similar(x0, length(x0), 3m+3)
    sol = aasol(f!, x0, m, Vstore; pdata = (ΣMF, Σ0, params), maxit, beta, atol)
    sol.errcode == 0 || println("`aasol` unsuccessful at $params")
    return (; cΣ=sol.solution, i=length(sol.history), e=last(sol.history))
    # Σ≡converged Σ, i≡iterations and e≡error
end

# ----- non-parametric versions (npv) of the above -----
function calculate_fixedpoint_npv(h, GS, V; m=1, maxit=100, beta=0.8, atol=1e-7, ΔSC=2.0, ΔSM=0.3, params...)
    
    ΣMF(; params...) = build_meanfield_selfenergies(greenfunction(h(; params...), GS), V; params...)(μ=0.0, kBT=0.0)

    Σ0 = ΣMF(; params..., ΔSC, ΔSM, Σ=zerofield)
    x0 = serialize(Float64, Σ0)
    function f!(x, x0, (ΣMF, Σ0, params))
        Σnew = ΣMF(; params..., Σ=deserialize(Σ0, x0))
        copy!(x, serialize(Float64, Σnew))
        return x
    end;

    Vstore = similar(x0, length(x0), 3m+3)
    sol = aasol(f!, x0, m, Vstore; pdata = (ΣMF, Σ0, params), maxit, beta, atol)
    sol.errcode == 0 || println("`aasol` unsuccessful at $params")
    return (; cΣ=sol.solution, i=length(sol.history), e=last(sol.history))
    # Σ≡converged Σ, i≡iterations and e≡error
end

function rasterscan_fixedpoint(fixedpoint, Vzs, μs)
    sols = @showprogress pmap(xy -> fixedpoint(xy[1], xy[2]), Iterators.product(Vzs, μs))
    cΣs = (x -> x.cΣ).(sols)
    is = (x -> x.i).(sols)
    es = (x -> x.e).(sols)
    return cΣs, is, es
end

# construct the converged hMF from the converged Σ
# a given Σ0 translator works for all (Vz, μ)
function converged_hMF(ΣMF::Quantica.MeanField, h, sols, Vzs, μs; params...)
    Σ0 = ΣMF(μ=0.0, kBT=0.0; params..., ΔSC=2.0, ΔSM=0.4)
    hMF(iVz, iμ; params2...) = h(; params..., Vz=Vzs[iVz], µ=µs[iμ], Σ=deserialize(Σ0, sols[1][iVz, iμ]), params2...)
    return hMF
end

# ----- non-parametric versions (npv) of the above -----
function converged_hMF_npv(h, GS, V, sols, Vzs, μs; params...)
    ΣMF(; params...) = build_meanfield_selfenergies(greenfunction(h(; params...), GS), V; params...)(μ=0.0, kBT=0.0)
    Σ0 = ΣMF(; params..., ΔSC=2.0, ΔSM=0.4)
    hMF(iVz, iμ) = h(; params..., Vz=Vzs[iVz], µ=µs[iμ], Σ=deserialize(Σ0, sols[1][iVz, iμ]))
    return hMF
end