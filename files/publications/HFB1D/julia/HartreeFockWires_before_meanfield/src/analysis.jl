# --- Spectrum solver ---
solver(Ei) = ES.ShiftInvert(ES.ArnoldiMethod(nev = Ei), 0)
function gapfix(h, iVz, iμ, Ei=1)
    eigs = abs.(real.(energies(spectrum(h(iVz, iμ); solver=solver(Ei)))))
    return isempty(eigs) ? gap(iVz, iµ, 2Ei) : minimum(eigs)
end

# --- Reconstructing Hamiltonian --- 
Srlzr(h) = serializer(Float64, h, siteselector(); encoder=NambuEncoder, decoder=NambuDecoder)
reconH(h) = hamiltonian(Srlzr(h))

# --- Analytical gap ---
function analΩ(Vz, μ, U; a0, ϵ0, m0=0.023)
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
