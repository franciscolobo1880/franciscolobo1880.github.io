# --- Calculating the gap at center of hyperbole ---
function calculate_gap(hMF, Vzs, μs)
    Ps = [invariant(hMF(iVz, iμ)) for (iVz, Vz) in enumerate(Vzs), (iμ, μ) in enumerate(μs)]
    iVz0 = argmax(replace!([findfirst(x->x==-1.0, Ps[iVz, :]) for (iVz, Vz) in enumerate(Vzs)], nothing => 0))
    iμ0 = findall(x->x==-1.0, Ps[iVz0, :])[Int(ceil(end/2))]
    Ω0s = [Quantica.gap(hMF(iVz, iμ0); nev=2) for (iVz, Vz) in enumerate(Vzs)]
    return Ps, iVz0, iμ0, Ω0s  
end

# --- Oreg-Lutchyn for comparisons---
pfaffian_OL(μ; μ0=0.0, Vzs=range(0.0, 1.0, 48), iVz0=0.0) = sqrt((μ-μ0)^2+Vzs[iVz0]^2)
function calculate_gap_OL(iVz0, Vzs, params)
    h = build_OregLutchyn_wire(L=params.L, a0=params.a0)
    params_OL = (; α=40.0, μ=0.0, Δ0=Vzs[iVz0])
    Ωs = [Quantica.gap(h(; params_OL..., Vz); nev=2) for Vz in Vzs]
    return Ωs
end
function bandstructure_OL(iVz0, Vzs, ks, params)
    h = build_OregLutchyn_wire(L=params.L, a0=params.a0)
    params_OL = (; α=40.0, μ=0.0, Δ0=Vzs[iVz0])
    BS = bands(h(;params_OL..., Vz=Vzs[iVz0]), ks)
    return BS
end


# --- Spectrum solver ---
solver(Ei) = ES.ShiftInvert(ES.ArnoldiMethod(nev = Ei), 0)
function gapfix(h, iVz, iμ, Ei=1)
    eigs = abs.(real.(energies(spectrum(h(iVz, iμ); solver=solver(Ei)))))
    return isempty(eigs) ? gap(iVz, iµ, 2Ei) : minimum(eigs)
end

# --- Calculating bands for finite case ---
function calculate_bands(h, V, GS, sols, Vzs, μs, iμ0, bmax; params...)
    ΣMF(; params...) = build_meanfield_selfenergies(greenfunction(h(; params...), GS), V; params...)(μ=0.0, kBT=0.0)
    Σ0 = ΣMF(; params...)
    b = bands(h, Vzs; mapping=Vz->ftuple(; params..., Vz, µ=µs[iμ0], Σ=deserialize(Σ0, sols[1][findfirst(x->x==Vz, Vzs), iμ0])), solver=solver(bmax))
    br = bands(h, Vzs; mapping=Vz->ftuple(; params..., Vz, µ=µs[iμ0], Σ=deserialize(Σ0, sols[1][findfirst(x->x==Vz, Vzs), iμ0])), solver=solver(2))
    return br, b
end

# --- BCS analytical gap ---
function BCSΩ(Vz, μ, U; a0, ϵ0, m0=0.023)
    Δ0 = µ<0 ? 0.0 : 2*ϵ0*exp( -(π*sqrt(ħ2ome*2*μ/m0))/(2*abs(U)*a0) )
    Vz==0.0 && return max(abs(Δ0), -µ)
    return max(0.0, abs(Δ0)-abs(Vz))
end

# --- Pfaffian invariant ---
function TH!(h::Matrix)
    n = size(h, 1)
    for j in 1:4:n-3, i in 1:4:n-3
        block = view(h, i:i+3, j:j+3)
        block .= SMatrix{4,4}(block) * σ0τx
    end
    h .= real.(h)
    h .-= h'
    h .*= 0.5
    return h
end
TH!(h) = TH!(Matrix(h))
TH(h, ϕ = 0; kw...) = TH!(Quantica.call!(h, ϕ; kw...))
invariant(h; kw...) = sign(real(pfaffian(TH(h, 0; kw...)))) * sign(real(pfaffian(TH(h, π; kw...))))
